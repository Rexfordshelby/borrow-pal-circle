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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, MessageSquare } from 'lucide-react';

interface OfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (offerData: { amount: number; message: string }) => void;
  type: 'price_offer' | 'counter_offer';
  currentAmount?: number;
}

export const OfferDialog: React.FC<OfferDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  type,
  currentAmount,
}) => {
  const [amount, setAmount] = useState(currentAmount?.toString() || '');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return;
    }
    onSubmit({ amount: numAmount, message });
    setAmount('');
    setMessage('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === 'price_offer' ? 'Make an Offer' : 'Counter Offer'}
          </DialogTitle>
          <DialogDescription>
            {type === 'price_offer'
              ? 'Propose your price for this order'
              : 'Provide your counter offer'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a message to explain your offer..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="hero" disabled={!amount}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Send Offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
