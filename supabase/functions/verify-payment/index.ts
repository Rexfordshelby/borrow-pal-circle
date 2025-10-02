import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Payment verification started");

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    logStep("Stripe initialized");

    // Initialize Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error(`Authentication failed: ${userError?.message}`);
    }
    logStep("User authenticated", { userId: userData.user.id });

    // Parse request body
    const { session_id } = await req.json();
    if (!session_id) {
      throw new Error("session_id is required");
    }
    logStep("Session ID received", { session_id });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'payment_intent']
    });
    logStep("Stripe session retrieved", { 
      status: session.payment_status,
      amount_total: session.amount_total 
    });

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return new Response(JSON.stringify({
        success: false,
        error: `Payment not completed. Status: ${session.payment_status}`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Extract metadata from the session
    const metadata = session.metadata || {};
    logStep("Session metadata", metadata);

    // Create payment record
    const paymentData = {
      user_id: userData.user.id,
      stripe_payment_intent_id: session.payment_intent?.id || session.id,
      amount: (session.amount_total || 0) / 100, // Convert from cents
      currency: session.currency || 'usd',
      status: 'completed',
      transaction_type: metadata.type || 'order',
      reference_id: metadata.order_id || null,
      metadata: {
        session_id,
        customer_email: session.customer_email,
        ...metadata
      }
    };

    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      logStep("Error creating payment record", paymentError);
      throw new Error(`Failed to create payment record: ${paymentError.message}`);
    }
    logStep("Payment record created", { paymentId: payment.id });

    // Update related transaction status if there's a reference
    if (metadata.order_id && metadata.order_type) {
      const table = metadata.order_type === 'lending' ? 'lending_transactions' : 'service_bookings';
      
      const { error: updateError } = await supabaseClient
        .from(table)
        .update({ 
          status: 'accepted',
          paid_at: new Date().toISOString(),
          payment_intent_id: session.payment_intent?.id || session.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', metadata.order_id);

      if (updateError) {
        logStep("Error updating transaction status", updateError);
      } else {
        logStep("Transaction status updated to paid", { orderId: metadata.order_id, table });
        
        // Create notification for the receiver
        const receiverIdField = metadata.order_type === 'lending' ? 'lender_id' : 'provider_id';
        const { data: orderData } = await supabaseClient
          .from(table)
          .select(receiverIdField)
          .eq('id', metadata.order_id)
          .single();
          
        if (orderData) {
          const receiverId = metadata.order_type === 'lending' 
            ? (orderData as any).lender_id 
            : (orderData as any).provider_id;
            
          await supabaseClient
            .from('notifications')
            .insert({
              user_id: receiverId,
              type: 'payment_received',
              title: 'Payment Received',
              message: `You have received a payment of $${(session.amount_total || 0) / 100}`,
              reference_id: metadata.order_id,
              reference_type: metadata.order_type === 'lending' ? 'lending_transaction' : 'service_booking'
            });
        }
      }
    }

    // Return success response
    const response = {
      success: true,
      transaction_id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      session_id,
      metadata: payment.metadata
    };

    logStep("Payment verification completed successfully", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-payment", { message: errorMessage });
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});