import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from './badge';
import { CheckCircle, Clock, XCircle, AlertCircle, Package, Truck, CreditCard } from 'lucide-react';

interface StatusIndicatorProps {
  status: string;
  type?: 'order' | 'payment' | 'delivery';
  className?: string;
  showIcon?: boolean;
}

export const StatusIndicator = ({ 
  status, 
  type = 'order', 
  className,
  showIcon = true 
}: StatusIndicatorProps) => {
  const getStatusConfig = () => {
    const normalizedStatus = status.toLowerCase();
    
    switch (normalizedStatus) {
      case 'pending':
        return {
          variant: 'warning' as const,
          icon: Clock,
          label: 'Pending'
        };
      case 'accepted':
      case 'approved':
        return {
          variant: 'success' as const,
          icon: CheckCircle,
          label: 'Accepted'
        };
      case 'declined':
      case 'rejected':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          label: 'Declined'
        };
      case 'ongoing':
      case 'active':
        return {
          variant: 'default' as const,
          icon: Package,
          label: 'Ongoing'
        };
      case 'completed':
      case 'delivered':
        return {
          variant: 'success' as const,
          icon: CheckCircle,
          label: 'Completed'
        };
      case 'overdue':
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          label: 'Overdue'
        };
      case 'shipped':
      case 'in_transit':
        return {
          variant: 'default' as const,
          icon: Truck,
          label: 'In Transit'
        };
      case 'paid':
        return {
          variant: 'success' as const,
          icon: CreditCard,
          label: 'Paid'
        };
      case 'unpaid':
        return {
          variant: 'warning' as const,
          icon: CreditCard,
          label: 'Unpaid'
        };
      case 'cancelled':
      case 'canceled':
        return {
          variant: 'secondary' as const,
          icon: XCircle,
          label: 'Cancelled'
        };
      default:
        return {
          variant: 'secondary' as const,
          icon: Clock,
          label: status.charAt(0).toUpperCase() + status.slice(1)
        };
    }
  };

  const { variant, icon: Icon, label } = getStatusConfig();

  return (
    <Badge variant={variant} className={cn("inline-flex items-center gap-1", className)}>
      {showIcon && <Icon className="w-3 h-3" />}
      {label}
    </Badge>
  );
};

export default StatusIndicator;