-- Phase 1: Enhance messages table for negotiations and payments
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS offer_type TEXT,
ADD COLUMN IF NOT EXISTS offer_data JSONB,
ADD COLUMN IF NOT EXISTS negotiation_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_status TEXT;

-- Add check constraints for offer types
ALTER TABLE messages 
DROP CONSTRAINT IF EXISTS messages_offer_type_check;

ALTER TABLE messages
ADD CONSTRAINT messages_offer_type_check 
CHECK (offer_type IS NULL OR offer_type IN ('price_offer', 'counter_offer', 'payment_request'));

-- Add check constraints for negotiation status
ALTER TABLE messages
DROP CONSTRAINT IF EXISTS messages_negotiation_status_check;

ALTER TABLE messages
ADD CONSTRAINT messages_negotiation_status_check
CHECK (negotiation_status IN ('pending', 'accepted', 'declined', 'completed'));

-- Add delivery/pickup options to lending_transactions
ALTER TABLE lending_transactions
ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'pickup',
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- Add delivery/pickup options to service_bookings  
ALTER TABLE service_bookings
ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'at_location',
ADD COLUMN IF NOT EXISTS service_address TEXT,
ADD COLUMN IF NOT EXISTS service_notes TEXT;

-- Add stripe account info to profiles for payment management
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_account_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_enabled BOOLEAN DEFAULT false;

-- Create index for faster message queries
CREATE INDEX IF NOT EXISTS idx_messages_chat_room_created 
ON messages(chat_room_id, created_at DESC);

-- Create index for offer messages
CREATE INDEX IF NOT EXISTS idx_messages_offer_type 
ON messages(offer_type) WHERE offer_type IS NOT NULL;

-- Set replica identity for real-time updates
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE chat_rooms REPLICA IDENTITY FULL;