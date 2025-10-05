-- Fix critical database issues with proper duplicate handling

-- 1. Delete self-referencing chat rooms first
DELETE FROM chat_rooms 
WHERE participant_1 = participant_2;

-- 2. Delete duplicate chat rooms (keep oldest one)
DELETE FROM chat_rooms a
USING chat_rooms b
WHERE a.id > b.id
  AND (
    (a.participant_1 = b.participant_1 AND a.participant_2 = b.participant_2)
    OR
    (a.participant_1 = b.participant_2 AND a.participant_2 = b.participant_1)
  );

-- 3. Add constraint to prevent self-chat
ALTER TABLE chat_rooms
ADD CONSTRAINT check_different_participants 
CHECK (participant_1 <> participant_2);

-- 4. Add unique constraint to prevent duplicate chat rooms
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_rooms_unique 
ON chat_rooms(LEAST(participant_1, participant_2), GREATEST(participant_1, participant_2));

-- 5. Fix QR code generation trigger
DROP TRIGGER IF EXISTS generate_qr_codes_trigger ON lending_transactions;
DROP TRIGGER IF EXISTS generate_qr_codes_trigger ON service_bookings;

CREATE OR REPLACE FUNCTION public.generate_qr_codes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('paid', 'accepted', 'ongoing') AND 
     (OLD.status IS NULL OR OLD.status NOT IN ('paid', 'accepted', 'ongoing')) THEN
    IF TG_TABLE_NAME = 'lending_transactions' THEN
      NEW.qr_delivery_code := encode(digest(NEW.id::TEXT || 'delivery' || now()::TEXT || gen_random_uuid()::TEXT, 'sha256'), 'base64');
      NEW.qr_return_code := encode(digest(NEW.id::TEXT || 'return' || now()::TEXT || gen_random_uuid()::TEXT, 'sha256'), 'base64');
    ELSIF TG_TABLE_NAME = 'service_bookings' THEN
      NEW.qr_service_start_code := encode(digest(NEW.id::TEXT || 'start' || now()::TEXT || gen_random_uuid()::TEXT, 'sha256'), 'base64');
      NEW.qr_service_complete_code := encode(digest(NEW.id::TEXT || 'complete' || now()::TEXT || gen_random_uuid()::TEXT, 'sha256'), 'base64');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER generate_qr_codes_trigger
BEFORE UPDATE ON lending_transactions
FOR EACH ROW
EXECUTE FUNCTION generate_qr_codes();

CREATE TRIGGER generate_qr_codes_trigger
BEFORE UPDATE ON service_bookings
FOR EACH ROW
EXECUTE FUNCTION generate_qr_codes();

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_participants 
ON chat_rooms(participant_1, participant_2);

CREATE INDEX IF NOT EXISTS idx_messages_chat_room 
ON messages(chat_room_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lending_status 
ON lending_transactions(status, borrower_id, lender_id);

CREATE INDEX IF NOT EXISTS idx_service_status 
ON service_bookings(status, customer_id, provider_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user 
ON notifications(user_id, is_read, created_at DESC);