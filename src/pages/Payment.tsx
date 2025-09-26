import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  CreditCard, 
  Shield, 
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  User
} from 'lucide-react';

interface PaymentData {
  type: 'item' | 'service';
  title: string;
  amount: number;
  duration?: string;
  provider?: string;
  description?: string;
}

const Payment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Get payment data from location state
    const data = location.state as PaymentData | null;
    if (!data) {
      navigate('/home');
      return;
    }

    setPaymentData(data);
  }, [user, navigate, location.state]);

  const handlePayment = async () => {
    if (!paymentData) return;

    setLoading(true);

    try {
      // In a real implementation, you would create a payment session here
      // For now, we'll simulate the payment process
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: paymentData.amount * 100, // Convert to cents
          currency: 'usd',
          description: `Payment for ${paymentData.title}`,
          metadata: {
            type: paymentData.type,
            title: paymentData.title,
            user_id: user.id
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.url) {
        // Redirect to Stripe checkout
        window.open(data.url, '_blank');
        
        // Navigate to success page after a delay
        setTimeout(() => {
          navigate('/payment-success', { 
            state: { 
              paymentData,
              sessionId: data.sessionId 
            }
          });
        }, 1000);
      }

    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Payment Error",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading payment information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50 card-shadow">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <h1 className="text-xl font-semibold">Complete Payment</h1>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Order Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{paymentData.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {paymentData.description || `${paymentData.type === 'item' ? 'Item rental' : 'Service booking'}`}
                  </p>
                  {paymentData.duration && (
                    <div className="flex items-center space-x-1 mt-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{paymentData.duration}</span>
                    </div>
                  )}
                  {paymentData.provider && (
                    <div className="flex items-center space-x-1 mt-1">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">By {paymentData.provider}</span>
                    </div>
                  )}
                </div>
                <Badge variant={paymentData.type === 'item' ? 'default' : 'secondary'}>
                  {paymentData.type === 'item' ? 'Item' : 'Service'}
                </Badge>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total Amount</span>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span>${paymentData.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Payment Method</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <div className="w-12 h-8 bg-primary rounded flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Secure Payment via Stripe</p>
                  <p className="text-sm text-muted-foreground">
                    Credit card, debit card, and digital wallets accepted
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Your payment information is encrypted and secure</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Button */}
          <Card className="card-shadow">
            <CardContent className="p-6">
              <Button
                onClick={handlePayment}
                disabled={loading}
                variant="hero"
                size="lg"
                className="w-full h-12 text-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay ${paymentData.amount.toFixed(2)}
                  </>
                )}
              </Button>

              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  By clicking "Pay", you agree to our Terms of Service and Privacy Policy.
                  You will be redirected to Stripe's secure payment page.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4" />
              <span>256-bit SSL encryption • PCI DSS compliant • Fraud protection</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Payment;