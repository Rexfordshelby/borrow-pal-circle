import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowRight,
  Smartphone,
  Shield,
  MessageCircle,
  Star,
  Users,
  Clock
} from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12 fade-in">
          <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-elegant">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4">
            BorrowPal
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Share, borrow, and connect with your community. 
            The peer-to-peer platform for everything you need.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 slide-up">
          <Card className="text-center p-6 card-shadow interactive-hover">
            <CardContent className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">Community Sharing</h3>
              <p className="text-sm text-muted-foreground">
                Connect with neighbors and share items you don't use daily
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 card-shadow interactive-hover">
            <CardContent className="space-y-4">
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-semibold">Secure & Protected</h3>
              <p className="text-sm text-muted-foreground">
                All transactions are protected with deposits and user verification
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 card-shadow interactive-hover">
            <CardContent className="space-y-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-semibold">Flexible Booking</h3>
              <p className="text-sm text-muted-foreground">
                Book items and services for exactly when you need them
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-6 slide-up">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Ready to get started?</h2>
            <p className="text-muted-foreground">
              Join thousands of people already sharing and saving in their communities
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Button
              variant="hero"
              size="lg"
              onClick={() => navigate('/auth?mode=signup')}
              className="flex items-center space-x-2 group"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/auth?mode=login')}
            >
              Sign In
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>4.9/5 rating</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>24/7 support</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t text-sm text-muted-foreground">
          <p>&copy; 2024 BorrowPal. Building stronger communities through sharing.</p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;