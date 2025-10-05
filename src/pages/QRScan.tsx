import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QRCodeScanner } from '@/components/qr/QRCodeScanner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const QRScan = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderType = searchParams.get('type') || 'lending';
  const action = searchParams.get('action') || 'delivery';

  const handleScan = async (qrData: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login to scan QR codes');
        navigate('/auth');
        return;
      }

      // Parse QR data (format: transactionId|qrCode)
      const [transactionId, qrCode] = qrData.split('|');

      if (!transactionId || !qrCode) {
        toast.error('Invalid QR code format');
        return;
      }

      // Call appropriate verification function based on order type
      let result;
      if (orderType === 'lending') {
        const { data, error } = await supabase.rpc('verify_lending_qr_scan', {
          p_transaction_id: transactionId,
          p_qr_code: qrCode,
          p_user_id: user.id,
          p_action: action,
        });

        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase.rpc('verify_service_qr_scan', {
          p_booking_id: transactionId,
          p_qr_code: qrCode,
          p_user_id: user.id,
          p_action: action === 'delivery' ? 'start_service' : 'complete_service',
        });

        if (error) throw error;
        result = data;
      }

      if (result.success) {
        toast.success(result.message);
        setTimeout(() => {
          navigate('/orders');
        }, 2000);
      } else {
        toast.error(result.error || 'QR verification failed');
      }
    } catch (error) {
      console.error('QR scan error:', error);
      toast.error('Failed to process QR code');
    }
  };

  const getTitle = () => {
    if (orderType === 'lending') {
      return action === 'delivery' ? 'Scan to Confirm Delivery' : 'Scan to Confirm Return';
    }
    return action === 'delivery' ? 'Scan to Start Service' : 'Scan to Complete Service';
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 pb-24">
      <div className="max-w-2xl mx-auto py-4 sm:py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <QRCodeScanner
          title={getTitle()}
          description="Scan the QR code to verify and complete the transaction"
          onScan={handleScan}
        />

        <div className="mt-8 space-y-4 text-center">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">How it works:</h3>
            <ol className="text-sm text-muted-foreground space-y-2 text-left list-decimal list-inside">
              <li>The other party shows you their QR code</li>
              <li>Click "Start Camera" and point at the QR code</li>
              <li>The transaction will be verified automatically</li>
              <li>Both parties will receive confirmation notifications</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScan;
