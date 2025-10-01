import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  Home, 
  MessageCircle,
  Calendar,
  DollarSign,
  Package,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const PaymentSuccess = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const paymentData = location.state?.paymentData;
  const sessionId = location.state?.sessionId || new URLSearchParams(location.search).get('session_id');
  const [verifying, setVerifying] = useState(!!sessionId && !location.state);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // If we have a session_id from URL but no state, verify the payment
    if (sessionId && !paymentData) {
      verifyPayment(sessionId);
      return;
    }

    if (!paymentData) {
      navigate('/home');
      return;
    }

    toast({
      title: "Payment Successful!",
      description: "Your order has been confirmed and the owner has been notified.",
    });
  }, [user, navigate, paymentData, sessionId, toast]);

  const verifyPayment = async (sid: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { session_id: sid }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Payment Verified!",
          description: "Your payment has been confirmed.",
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: "Verification Issue",
        description: "Payment completed but verification pending. Check your orders page.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleGoHome = () => {
    navigate('/home');
  };

  const handleViewOrders = () => {
    navigate('/orders');
  };

  const handleContactOwner = () => {
    navigate('/chat');
  };

  if (!paymentData || verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">{verifying ? 'Verifying payment...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="space-y-8">
          {/* Success Animation */}
          <div className="text-center space-y-4 fade-in">
            <div className="relative">
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-primary-foreground" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold gradient-text">Payment Successful!</h1>
              <p className="text-lg text-muted-foreground">
                Your {paymentData.type === 'item' ? 'rental' : 'booking'} has been confirmed
              </p>
            </div>
          </div>

          {/* Order Confirmation */}
          <Card className="card-shadow slide-up">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Order Confirmation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{paymentData.title}</h3>
                  <p className="text-muted-foreground mt-1">
                    {paymentData.type === 'item' ? 'Item Rental' : 'Service Booking'}
                  </p>
                  {paymentData.duration && (
                    <div className="flex items-center space-x-1 mt-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{paymentData.duration}</span>
                    </div>
                  )}
                </div>
                <Badge variant="success" className="flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Confirmed</span>
                </Badge>
              </div>

              <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Amount Paid</span>
                  <div className="flex items-center space-x-1 font-bold text-success">
                    <DollarSign className="w-4 h-4" />
                    <span>${paymentData.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {sessionId && (
                <div className="text-xs text-muted-foreground">
                  Transaction ID: {sessionId}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="card-shadow slide-up">
            <CardHeader>
              <CardTitle>What happens next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Owner Notification</p>
                    <p className="text-sm text-muted-foreground">
                      The {paymentData.type === 'item' ? 'item owner' : 'service provider'} has been notified and will confirm your {paymentData.type === 'item' ? 'rental' : 'booking'}.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Communication Unlocked</p>
                    <p className="text-sm text-muted-foreground">
                      You can now chat with the {paymentData.type === 'item' ? 'owner' : 'provider'} to arrange pickup/delivery details.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Enjoy Your {paymentData.type === 'item' ? 'Rental' : 'Service'}</p>
                    <p className="text-sm text-muted-foreground">
                      Complete your transaction and don't forget to leave a review!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3 slide-up">
            <Button
              onClick={handleContactOwner}
              variant="hero"
              size="lg"
              className="w-full"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Contact {paymentData.type === 'item' ? 'Owner' : 'Provider'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleViewOrders}
                variant="outline"
                size="lg"
              >
                <Package className="w-4 h-4 mr-2" />
                View Orders
              </Button>

              <Button
                onClick={handleGoHome}
                variant="outline"
                size="lg"
              >
                <Home className="w-4 h-4 mr-2" />
                Browse More
              </Button>
            </div>
          </div>

          {/* Support Info */}
          <div className="text-center space-y-2 text-sm text-muted-foreground">
            <p>Need help? We're here to support you.</p>
            <p>Questions about your order? Check your Orders page or contact support.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccess;