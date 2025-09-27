-- Fix notifications table - add missing reference_type column
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS reference_type TEXT;

-- Update the notification trigger function to handle reference_type properly
CREATE OR REPLACE FUNCTION public.create_order_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- For lending transactions
  IF TG_TABLE_NAME = 'lending_transactions' THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      reference_id,
      reference_type
    ) VALUES (
      NEW.lender_id,
      'order_request',
      'New Borrow Request',
      'Someone wants to borrow your item',
      NEW.id,
      'lending_transaction'
    );
  END IF;
  
  -- For service bookings
  IF TG_TABLE_NAME = 'service_bookings' THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      reference_id,
      reference_type
    ) VALUES (
      NEW.provider_id,
      'booking_request',
      'New Service Booking',
      'Someone wants to book your service',
      NEW.id,
      'service_booking'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Ensure triggers exist
DROP TRIGGER IF EXISTS on_lending_transaction_created ON public.lending_transactions;
CREATE TRIGGER on_lending_transaction_created
  AFTER INSERT ON public.lending_transactions
  FOR EACH ROW EXECUTE FUNCTION public.create_order_notification();

DROP TRIGGER IF EXISTS on_service_booking_created ON public.service_bookings;
CREATE TRIGGER on_service_booking_created
  AFTER INSERT ON public.service_bookings
  FOR EACH ROW EXECUTE FUNCTION public.create_order_notification();