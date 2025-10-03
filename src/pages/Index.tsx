import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  Package, 
  Wrench,
  MessageCircle,
  Shield
} from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        <div className="space-y-4 fade-in">
          <img 
            src="/logo.png" 
            alt="BorrowPal Logo" 
            className="w-24 h-24 mx-auto object-contain"
          />
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold gradient-text">BorrowPal</h1>
            <p className="text-lg text-muted-foreground">
              Your community marketplace for sharing and borrowing
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-4 slide-up">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2 justify-center">
              <Package className="w-4 h-4 text-primary" />
              <span>Borrow Items</span>
            </div>
            <div className="flex items-center space-x-2 justify-center">
              <Wrench className="w-4 h-4 text-primary" />
              <span>Book Services</span>
            </div>
            <div className="flex items-center space-x-2 justify-center">
              <MessageCircle className="w-4 h-4 text-primary" />
              <span>Safe Messaging</span>
            </div>
            <div className="flex items-center space-x-2 justify-center">
              <Shield className="w-4 h-4 text-primary" />
              <span>Secure Payments</span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 slide-up">
          <Button
            onClick={() => navigate('/auth')}
            variant="hero"
            size="lg"
            className="w-full"
          >
            Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          <Button
            onClick={() => navigate('/home')}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Browse as Guest
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>✓ Community verified • ✓ Secure payments • ✓ Insurance covered</p>
          <p>Join thousands of happy neighbors sharing and saving together</p>
        </div>
      </div>
    </div>
  );
};

export default Index;