import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Shield, CheckCircle, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  orderDetails: {
    title: string;
    type: 'item' | 'service';
    orderId: string;
  };
  onSuccess: () => void;
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onOpenChange,
  amount,
  orderDetails,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to complete payment",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Creating Payment Session",
        description: "Preparing your secure payment...",
      });

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          description: `Payment for ${orderDetails.title}`,
          metadata: {
            order_type: orderDetails.type,
            order_id: orderDetails.orderId,
            title: orderDetails.title,
            user_id: user.id,
          }
        }
      });

      if (error) {
        console.error('Payment error:', error);
        toast({
          title: "Payment Failed",
          description: error.message || "Unable to create payment session",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        // Open in new tab with security attributes
        window.open(data.url, '_blank', 'noopener,noreferrer');
        
        toast({
          title: "Payment Window Opened",
          description: "Complete payment in the new window. We'll notify both parties automatically.",
          duration: 5000,
        });

        // Wait a moment before closing dialog
        setTimeout(() => {
          onOpenChange(false);
          onSuccess();
        }, 1500);
      } else {
        toast({
          title: "Error",
          description: "No payment URL received. Please try again.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Complete Payment</span>
          </DialogTitle>
          <DialogDescription>
            Secure payment processed by Stripe
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold">{orderDetails.title}</h4>
                <Badge variant={orderDetails.type === 'item' ? 'default' : 'secondary'} className="mt-1">
                  {orderDetails.type === 'item' ? 'Item Rental' : 'Service'}
                </Badge>
              </div>
            </div>

            <div className="border-t pt-3 flex items-center justify-between text-lg font-semibold">
              <span>Total Amount</span>
              <div className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4" />
                <span>${amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="space-y-2">
            <div className="flex items-start space-x-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
              <div>
                <p className="font-medium text-foreground">Secure Stripe Payment</p>
                <p className="text-xs">
                  256-bit SSL encryption protects your payment information
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
              <div>
                <p className="font-medium text-foreground">Instant Verification</p>
                <p className="text-xs">
                  Both you and the owner will be notified immediately when payment completes
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
              <div>
                <p className="font-medium text-foreground">Buyer Protection</p>
                <p className="text-xs">
                  Your payment is protected by Stripe's security measures
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={handlePayment}
            disabled={loading}
            variant="hero"
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay ${amount.toFixed(2)}
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
