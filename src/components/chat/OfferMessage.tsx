import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Check, X, CreditCard } from 'lucide-react';

interface OfferMessageProps {
  offer: {
    id: string;
    amount: number;
    message?: string;
    type: 'price_offer' | 'counter_offer' | 'payment_request';
    status: 'pending' | 'accepted' | 'declined' | 'completed';
  };
  isOwnMessage: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  onCounterOffer?: () => void;
  onPay?: () => void;
}

export const OfferMessage: React.FC<OfferMessageProps> = ({
  offer,
  isOwnMessage,
  onAccept,
  onDecline,
  onCounterOffer,
  onPay,
}) => {
  const getStatusColor = () => {
    switch (offer.status) {
      case 'accepted': return 'bg-success';
      case 'declined': return 'bg-destructive';
      case 'completed': return 'bg-primary';
      default: return 'bg-muted';
    }
  };

  const getStatusText = () => {
    switch (offer.status) {
      case 'accepted': return 'Accepted';
      case 'declined': return 'Declined';
      case 'completed': return 'Paid';
      default: return 'Pending';
    }
  };

  return (
    <div className={`rounded-lg p-4 border-2 ${getStatusColor()} bg-opacity-10`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-5 h-5" />
          <span className="font-semibold text-lg">
            ${offer.amount.toFixed(2)}
          </span>
        </div>
        <Badge variant={offer.status === 'accepted' ? 'success' : 'secondary'}>
          {getStatusText()}
        </Badge>
      </div>

      {offer.message && (
        <p className="text-sm text-muted-foreground mb-3">
          "{offer.message}"
        </p>
      )}

      {/* Action Buttons */}
      {!isOwnMessage && offer.status === 'pending' && (
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            size="sm"
            variant="hero"
            onClick={onAccept}
            className="flex-1"
          >
            <Check className="w-4 h-4 mr-1" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDecline}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-1" />
            Decline
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onCounterOffer}
            className="w-full"
          >
            Make Counter Offer
          </Button>
        </div>
      )}

      {/* Payment Button for Accepted Offers */}
      {isOwnMessage && offer.status === 'accepted' && offer.type !== 'payment_request' && (
        <Button
          size="sm"
          variant="hero"
          onClick={onPay}
          className="w-full mt-3"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Pay Now
        </Button>
      )}

      {/* Status Messages */}
      {offer.status === 'completed' && (
        <div className="mt-3 text-sm text-success flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span>Payment completed successfully</span>
        </div>
      )}
    </div>
  );
};
