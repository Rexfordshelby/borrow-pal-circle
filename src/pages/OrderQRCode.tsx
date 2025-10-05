import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { QRCodeGenerator } from '@/components/qr/QRCodeGenerator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';

const OrderQRCode = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [qrValue, setQrValue] = useState('');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  
  const orderType = searchParams.get('type') || 'lending';
  const action = searchParams.get('action') || 'delivery';

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchOrderAndGenerateQR();
  }, [orderId, orderType, action, user]);

  const fetchOrderAndGenerateQR = async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      let order;
      let qrCode;

      if (orderType === 'lending') {
        const { data, error } = await supabase
          .from('lending_transactions')
          .select('*, items(*), lender_profile:profiles!lender_id(*), borrower_profile:profiles!borrower_id(*)')
          .eq('id', orderId)
          .single();

        if (error) throw error;
        order = data;

        // Check if QR code exists, if not generate one
        if (action === 'delivery') {
          if (!order.qr_delivery_code) {
            const { data: qrData, error: qrError } = await supabase
              .rpc('generate_qr_code', {
                transaction_id: orderId,
                action_type: 'delivery',
              });

            if (qrError) throw qrError;
            qrCode = qrData;

            // Update transaction with new QR code
            await supabase
              .from('lending_transactions')
              .update({ qr_delivery_code: qrCode })
              .eq('id', orderId);
          } else {
            qrCode = order.qr_delivery_code;
          }
        } else {
          if (!order.qr_return_code) {
            const { data: qrData, error: qrError } = await supabase
              .rpc('generate_qr_code', {
                transaction_id: orderId,
                action_type: 'return',
              });

            if (qrError) throw qrError;
            qrCode = qrData;

            await supabase
              .from('lending_transactions')
              .update({ qr_return_code: qrCode })
              .eq('id', orderId);
          } else {
            qrCode = order.qr_return_code;
          }
        }
      } else {
        const { data, error } = await supabase
          .from('service_bookings')
          .select('*, services(*), provider_profile:profiles!provider_id(*), customer_profile:profiles!customer_id(*)')
          .eq('id', orderId)
          .single();

        if (error) throw error;
        order = data;

        if (action === 'delivery') {
          if (!order.qr_service_start_code) {
            const { data: qrData, error: qrError } = await supabase
              .rpc('generate_qr_code', {
                transaction_id: orderId,
                action_type: 'start_service',
              });

            if (qrError) throw qrError;
            qrCode = qrData;

            await supabase
              .from('service_bookings')
              .update({ qr_service_start_code: qrCode })
              .eq('id', orderId);
          } else {
            qrCode = order.qr_service_start_code;
          }
        } else {
          if (!order.qr_service_complete_code) {
            const { data: qrData, error: qrError } = await supabase
              .rpc('generate_qr_code', {
                transaction_id: orderId,
                action_type: 'complete_service',
              });

            if (qrError) throw qrError;
            qrCode = qrData;

            await supabase
              .from('service_bookings')
              .update({ qr_service_complete_code: qrCode })
              .eq('id', orderId);
          } else {
            qrCode = order.qr_service_complete_code;
          }
        }
      }

      setOrderDetails(order);
      // Format: transactionId|qrCode for scanning
      setQrValue(`${orderId}|${qrCode}`);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (orderType === 'lending') {
      return action === 'delivery' ? 'Delivery QR Code' : 'Return QR Code';
    }
    return action === 'delivery' ? 'Service Start QR Code' : 'Service Completion QR Code';
  };

  const getDescription = () => {
    if (orderType === 'lending') {
      return action === 'delivery' 
        ? 'Show this to the lender to confirm item delivery'
        : 'Show this to the lender to confirm item return';
    }
    return action === 'delivery'
      ? 'Show this to the provider to start the service'
      : 'Show this to the provider to complete the service';
  };

  const getStatus = () => {
    if (!orderDetails) return 'active';
    
    if (orderType === 'lending') {
      if (action === 'delivery' && orderDetails.delivery_confirmed_at) return 'scanned';
      if (action === 'return' && orderDetails.return_confirmed_at) return 'scanned';
    } else {
      if (action === 'delivery' && orderDetails.service_started_at) return 'scanned';
      if (action === 'return' && orderDetails.service_completed_at) return 'scanned';
    }
    
    return 'active';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 pb-24">
      <div className="max-w-2xl mx-auto py-4 sm:py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/orders')}
          className="mb-4 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>

        <QRCodeGenerator
          value={qrValue}
          title={getTitle()}
          description={getDescription()}
          status={getStatus()}
          onDownload={() => toast.success('QR code downloaded')}
        />

        <div className="mt-8 space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold">Order Details:</h3>
            {orderDetails && (
              <div className="text-sm space-y-1">
                <p><strong>Item/Service:</strong> {orderDetails.items?.title || orderDetails.services?.title}</p>
                <p><strong>Amount:</strong> ${orderDetails.total_amount}</p>
                <p><strong>Status:</strong> {orderDetails.status}</p>
              </div>
            )}
          </div>

          <div className="bg-primary/10 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Instructions:</h3>
            <ol className="text-sm space-y-2 list-decimal list-inside">
              <li>Show this QR code to the other party</li>
              <li>They will scan it using their BorrowPal app</li>
              <li>Transaction will be verified automatically</li>
              <li>Both parties will receive confirmation</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderQRCode;
