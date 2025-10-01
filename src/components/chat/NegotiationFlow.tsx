import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, MessageSquare, Check } from 'lucide-react';

interface NegotiationFlowProps {
  orderType: 'item' | 'service';
  originalAmount: number;
  onStartNegotiation: () => void;
  onDirectPayment: () => void;
}

export const NegotiationFlow: React.FC<NegotiationFlowProps> = ({
  orderType,
  originalAmount,
  onStartNegotiation,
  onDirectPayment,
}) => {
  return (
    <Card className="p-4 bg-muted/30 border-2 border-dashed border-primary/30">
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold">Ready to Complete Your Order?</h3>
          <div className="flex items-center justify-center space-x-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold text-primary">
              ${originalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={onDirectPayment}
            variant="hero"
            size="lg"
            className="w-full"
          >
            <Check className="w-4 h-4 mr-2" />
            Pay Now
          </Button>
          
          <Button
            onClick={onStartNegotiation}
            variant="outline"
            size="lg"
            className="w-full"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Negotiate Price
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Start a conversation to negotiate or pay the listed price directly
        </p>
      </div>
    </Card>
  );
};
