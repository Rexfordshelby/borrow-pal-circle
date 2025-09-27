import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import EnhancedLoading from '@/components/ui/enhanced-loading';
import StatusIndicator from '@/components/ui/status-indicator';
import { CheckCircle, XCircle, AlertCircle, ArrowRight, Home, MessageCircle } from 'lucide-react';

interface PaymentVerificationData {
  success: boolean;
  session_id?: string;
  transaction_id?: string;
  amount?: number;
  currency?: string;
  metadata?: any;
  error?: string;
}

const PaymentVerification = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState<PaymentVerificationData | null>(null);
  
  const sessionId = searchParams.get('session_id');
  const success = searchParams.get('success') === 'true';
  const cancelled = searchParams.get('cancelled') === 'true';

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (cancelled) {
      setVerification({ success: false, error: 'Payment was cancelled by user' });
      setLoading(false);
      return;
    }

    if (success && sessionId) {
      verifyPayment();
    } else {
      setVerification({ success: false, error: 'Invalid payment parameters' });
      setLoading(false);
    }
  }, [user, sessionId, success, cancelled]);

  const verifyPayment = async () => {
    try {
      // Call verification edge function
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { session_id: sessionId }
      });

      if (error) {
        console.error('Payment verification error:', error);
        setVerification({ 
          success: false, 
          error: 'Failed to verify payment. Please contact support.' 
        });
        return;
      }

      setVerification(data);

      if (data.success) {
        toast({
          title: "Payment Verified!",
          description: "Your payment has been processed successfully.",
        });
      } else {
        toast({
          title: "Payment Failed",
          description: data.error || "Payment verification failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setVerification({ 
        success: false, 
        error: 'An unexpected error occurred during verification' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <div className="absolute inset-0 animate-pulse-ring w-16 h-16 border-2 border-primary-light rounded-full mx-auto"></div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Verifying Payment</h2>
              <p className="text-muted-foreground">Please wait while we confirm your transaction...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!verification) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-warning mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verification Error</h2>
            <p className="text-muted-foreground mb-4">Unable to process payment verification</p>
            <Button onClick={() => navigate('/home')}>Return Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="space-y-8">
          {/* Main Result Card */}
          <div className="fade-in">
            <Card className="card-shadow-hover text-center">
              <CardContent className="py-12">
                {verification.success ? (
                  <>
                    <div className="w-20 h-20 hero-gradient rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-success mb-2">Payment Successful!</h1>
                    <p className="text-muted-foreground text-lg">
                      Your transaction has been processed successfully
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-destructive rounded-full flex items-center justify-center mx-auto mb-6">
                      <XCircle className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-destructive mb-2">Payment Failed</h1>
                    <p className="text-muted-foreground text-lg">
                      {verification.error || 'Your payment could not be processed'}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transaction Details */}
          {verification.success && (
            <div className="slide-up">
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span>Transaction Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {verification.transaction_id && (
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">Transaction ID</span>
                      <span className="font-mono text-sm">{verification.transaction_id}</span>
                    </div>
                  )}
                  
                  {verification.amount && (
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-semibold text-lg">
                        ${verification.amount} {verification.currency?.toUpperCase() || 'USD'}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">Status</span>
                    <StatusIndicator status="completed" type="payment" />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Date</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Next Steps */}
          <div className="scale-in">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>What's Next?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {verification.success ? (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 p-3 bg-success/10 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                        <div>
                          <h4 className="font-medium">Order Confirmed</h4>
                          <p className="text-sm text-muted-foreground">
                            Your order has been confirmed and the owner has been notified
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 p-3 bg-primary/10 rounded-lg">
                        <MessageCircle className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium">Chat Available</h4>
                          <p className="text-sm text-muted-foreground">
                            You can now message the owner to coordinate pickup/delivery
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                        <ArrowRight className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <h4 className="font-medium">Order Tracking</h4>
                          <p className="text-sm text-muted-foreground">
                            Track your order status in the Orders section
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 bg-warning/10 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                      <div>
                        <h4 className="font-medium">Payment Issue</h4>
                        <p className="text-sm text-muted-foreground">
                          Please try again or contact support if the problem persists
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="bounce-in flex flex-col sm:flex-row gap-4">
            <Button
              variant="hero"
              className="flex-1"
              onClick={() => navigate(verification.success ? '/orders' : '/home')}
            >
              {verification.success ? (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  View Orders
                </>
              ) : (
                <>
                  <Home className="w-4 h-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
            
            {verification.success && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/chat')}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Message Owner
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => navigate('/home')}
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentVerification;