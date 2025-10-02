-- Fix message types and add foreign key constraints

-- Update message_type check constraint to include 'offer'
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_message_type_check 
  CHECK (message_type IN ('text', 'offer', 'payment_request', 'system'));

-- Update offer_type check constraint
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_offer_type_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_offer_type_check 
  CHECK (offer_type IS NULL OR offer_type IN ('price_offer', 'counter_offer', 'payment_request'));

-- Update negotiation_status check constraint  
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_negotiation_status_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_negotiation_status_check 
  CHECK (negotiation_status IS NULL OR negotiation_status IN ('pending', 'accepted', 'declined', 'completed'));

-- Update payment_status check constraint
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_payment_status_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_payment_status_check 
  CHECK (payment_status IS NULL OR payment_status IN ('pending', 'processing', 'completed', 'failed'));

-- Add foreign key constraints for profiles (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chat_rooms_participant_1_fkey'
  ) THEN
    ALTER TABLE public.chat_rooms 
    ADD CONSTRAINT chat_rooms_participant_1_fkey 
    FOREIGN KEY (participant_1) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chat_rooms_participant_2_fkey'
  ) THEN
    ALTER TABLE public.chat_rooms 
    ADD CONSTRAINT chat_rooms_participant_2_fkey 
    FOREIGN KEY (participant_2) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create function to notify both parties on payment completion
CREATE OR REPLACE FUNCTION public.notify_payment_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payer_id UUID;
  v_receiver_id UUID;
  v_order_type TEXT;
  v_amount NUMERIC;
BEGIN
  -- Only trigger on payment completion
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    v_payer_id := NEW.user_id;
    v_amount := NEW.amount;
    
    -- Get receiver based on order type
    IF NEW.metadata ? 'order_type' AND NEW.metadata ? 'order_id' THEN
      v_order_type := NEW.metadata->>'order_type';
      
      IF v_order_type = 'lending' THEN
        SELECT lender_id INTO v_receiver_id
        FROM lending_transactions
        WHERE id = (NEW.metadata->>'order_id')::UUID;
      ELSIF v_order_type = 'service' THEN
        SELECT provider_id INTO v_receiver_id
        FROM service_bookings
        WHERE id = (NEW.metadata->>'order_id')::UUID;
      END IF;
      
      -- Notify receiver
      IF v_receiver_id IS NOT NULL THEN
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          reference_id,
          reference_type
        ) VALUES (
          v_receiver_id,
          'payment_received',
          'Payment Received! 💰',
          'You received $' || v_amount::TEXT || ' for your ' || 
          CASE WHEN v_order_type = 'lending' THEN 'item' ELSE 'service' END,
          (NEW.metadata->>'order_id')::UUID,
          CASE WHEN v_order_type = 'lending' THEN 'lending_transaction' ELSE 'service_booking' END
        );
      END IF;
      
      -- Notify payer (confirmation)
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        reference_id,
        reference_type
      ) VALUES (
        v_payer_id,
        'payment_completed',
        'Payment Successful ✅',
        'Your payment of $' || v_amount::TEXT || ' has been processed successfully',
        (NEW.metadata->>'order_id')::UUID,
        CASE WHEN v_order_type = 'lending' THEN 'lending_transaction' ELSE 'service_booking' END
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for payment notifications
DROP TRIGGER IF EXISTS trigger_notify_payment_completed ON public.payments;
CREATE TRIGGER trigger_notify_payment_completed
AFTER INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.notify_payment_completed();

-- Update notifications type constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('order_request', 'booking_request', 'payment_received', 'payment_completed', 
                  'order_accepted', 'order_declined', 'message', 'system'));