-- Fix the notifications type constraint to allow order_request and booking_request
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add updated constraint with all needed notification types
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('order_request', 'booking_request', 'message', 'review', 'payment', 'system', 'reminder'));

-- Also ensure reference_type column allows the values we use
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_reference_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_reference_type_check 
CHECK (reference_type IS NULL OR reference_type IN ('lending_transaction', 'service_booking', 'payment', 'review', 'message'));