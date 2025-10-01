-- Add payment_received to notification types
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('order_request', 'booking_request', 'order_accepted', 'order_declined', 'payment_received', 'message', 'review'));

-- Update check constraints for order_actions
ALTER TABLE order_actions
DROP CONSTRAINT IF EXISTS order_actions_action_check;

ALTER TABLE order_actions
ADD CONSTRAINT order_actions_action_check
CHECK (action IN ('accepted', 'declined', 'completed', 'cancelled', 'payment_received'));

-- Add payment notification function
CREATE OR REPLACE FUNCTION notify_payment_received()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  order_type TEXT;
  order_amount NUMERIC;
BEGIN
  -- Determine recipient based on payment metadata
  IF NEW.metadata ? 'order_type' AND NEW.metadata ? 'order_id' THEN
    order_type := NEW.metadata->>'order_type';
    
    IF order_type = 'item' OR order_type = 'lending' THEN
      SELECT lender_id INTO recipient_id
      FROM lending_transactions
      WHERE id = (NEW.metadata->>'order_id')::UUID;
      
      SELECT total_amount INTO order_amount
      FROM lending_transactions
      WHERE id = (NEW.metadata->>'order_id')::UUID;
    ELSIF order_type = 'service' THEN
      SELECT provider_id INTO recipient_id
      FROM service_bookings
      WHERE id = (NEW.metadata->>'order_id')::UUID;
      
      SELECT total_amount INTO order_amount
      FROM service_bookings
      WHERE id = (NEW.metadata->>'order_id')::UUID;
    END IF;
    
    -- Create notification if recipient found
    IF recipient_id IS NOT NULL THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        reference_id,
        reference_type
      ) VALUES (
        recipient_id,
        'payment_received',
        'Payment Received',
        'You have received a payment of $' || (NEW.amount / 100)::TEXT,
        (NEW.metadata->>'order_id')::UUID,
        CASE 
          WHEN order_type = 'item' OR order_type = 'lending' THEN 'lending_transaction'
          ELSE 'service_booking'
        END
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for payment notifications
DROP TRIGGER IF EXISTS on_payment_created ON payments;
CREATE TRIGGER on_payment_created
  AFTER INSERT ON payments
  FOR EACH ROW
  WHEN (NEW.status = 'succeeded')
  EXECUTE FUNCTION notify_payment_received();