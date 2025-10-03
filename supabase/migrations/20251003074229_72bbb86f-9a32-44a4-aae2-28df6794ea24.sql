-- Add QR verification columns to lending_transactions
ALTER TABLE lending_transactions 
ADD COLUMN IF NOT EXISTS qr_delivery_code TEXT,
ADD COLUMN IF NOT EXISTS qr_return_code TEXT,
ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_confirmed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS return_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS return_confirmed_by UUID REFERENCES auth.users(id);

-- Add QR verification columns to service_bookings
ALTER TABLE service_bookings 
ADD COLUMN IF NOT EXISTS qr_service_start_code TEXT,
ADD COLUMN IF NOT EXISTS qr_service_complete_code TEXT,
ADD COLUMN IF NOT EXISTS service_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS service_started_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS service_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS service_completed_by UUID REFERENCES auth.users(id);

-- Create function to generate QR code hash
CREATE OR REPLACE FUNCTION generate_qr_code(transaction_id UUID, action_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(
    digest(
      transaction_id::TEXT || action_type || now()::TEXT || gen_random_uuid()::TEXT,
      'sha256'
    ),
    'base64'
  );
END;
$$;

-- Create function to verify and process QR scan for lending transactions
CREATE OR REPLACE FUNCTION verify_lending_qr_scan(
  p_transaction_id UUID,
  p_qr_code TEXT,
  p_user_id UUID,
  p_action TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction RECORD;
  v_result JSONB;
BEGIN
  -- Get transaction details
  SELECT * INTO v_transaction
  FROM lending_transactions
  WHERE id = p_transaction_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction not found');
  END IF;
  
  -- Verify user authorization
  IF p_action = 'delivery' THEN
    IF v_transaction.lender_id != p_user_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'Only the lender can confirm delivery');
    END IF;
    
    IF v_transaction.qr_delivery_code != p_qr_code THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid QR code');
    END IF;
    
    IF v_transaction.delivery_confirmed_at IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Delivery already confirmed');
    END IF;
    
    -- Update transaction
    UPDATE lending_transactions
    SET delivery_confirmed_at = now(),
        delivery_confirmed_by = p_user_id,
        status = 'borrowed'
    WHERE id = p_transaction_id;
    
    -- Create notification for borrower
    INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      v_transaction.borrower_id,
      'delivery_confirmed',
      'Item Delivered! 📦',
      'The lender has confirmed item delivery. Enjoy!',
      p_transaction_id,
      'lending_transaction'
    );
    
    v_result := jsonb_build_object(
      'success', true,
      'message', 'Delivery confirmed successfully',
      'status', 'borrowed'
    );
    
  ELSIF p_action = 'return' THEN
    IF v_transaction.lender_id != p_user_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'Only the lender can confirm return');
    END IF;
    
    IF v_transaction.qr_return_code != p_qr_code THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid QR code');
    END IF;
    
    IF v_transaction.return_confirmed_at IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Return already confirmed');
    END IF;
    
    -- Update transaction
    UPDATE lending_transactions
    SET return_confirmed_at = now(),
        return_confirmed_by = p_user_id,
        status = 'completed',
        actual_return_date = CURRENT_DATE
    WHERE id = p_transaction_id;
    
    -- Create notification for borrower
    INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      v_transaction.borrower_id,
      'return_confirmed',
      'Return Confirmed! ✅',
      'The lender has confirmed item return. Transaction complete!',
      p_transaction_id,
      'lending_transaction'
    );
    
    -- Award XP for completion
    PERFORM award_xp(v_transaction.lender_id, 50);
    PERFORM award_xp(v_transaction.borrower_id, 50);
    
    v_result := jsonb_build_object(
      'success', true,
      'message', 'Return confirmed successfully',
      'status', 'completed'
    );
    
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;
  
  RETURN v_result;
END;
$$;

-- Create function to verify and process QR scan for service bookings
CREATE OR REPLACE FUNCTION verify_service_qr_scan(
  p_booking_id UUID,
  p_qr_code TEXT,
  p_user_id UUID,
  p_action TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_result JSONB;
BEGIN
  -- Get booking details
  SELECT * INTO v_booking
  FROM service_bookings
  WHERE id = p_booking_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found');
  END IF;
  
  -- Verify user authorization
  IF p_action = 'start_service' THEN
    IF v_booking.customer_id != p_user_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'Only the customer can start the service');
    END IF;
    
    IF v_booking.qr_service_start_code != p_qr_code THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid QR code');
    END IF;
    
    IF v_booking.service_started_at IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Service already started');
    END IF;
    
    -- Update booking
    UPDATE service_bookings
    SET service_started_at = now(),
        service_started_by = p_user_id,
        status = 'ongoing'
    WHERE id = p_booking_id;
    
    -- Create notification for provider
    INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      v_booking.provider_id,
      'service_started',
      'Service Started! 🚀',
      'The customer has confirmed service start.',
      p_booking_id,
      'service_booking'
    );
    
    v_result := jsonb_build_object(
      'success', true,
      'message', 'Service started successfully',
      'status', 'ongoing'
    );
    
  ELSIF p_action = 'complete_service' THEN
    IF v_booking.customer_id != p_user_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'Only the customer can complete the service');
    END IF;
    
    IF v_booking.qr_service_complete_code != p_qr_code THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid QR code');
    END IF;
    
    IF v_booking.service_completed_at IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Service already completed');
    END IF;
    
    -- Update booking
    UPDATE service_bookings
    SET service_completed_at = now(),
        service_completed_by = p_user_id,
        status = 'completed'
    WHERE id = p_booking_id;
    
    -- Create notification for provider
    INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (
      v_booking.provider_id,
      'service_completed',
      'Service Completed! 🎉',
      'The customer has confirmed service completion.',
      p_booking_id,
      'service_booking'
    );
    
    -- Award XP for completion
    PERFORM award_xp(v_booking.provider_id, 50);
    PERFORM award_xp(v_booking.customer_id, 50);
    
    v_result := jsonb_build_object(
      'success', true,
      'message', 'Service completed successfully',
      'status', 'completed'
    );
    
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;
  
  RETURN v_result;
END;
$$;