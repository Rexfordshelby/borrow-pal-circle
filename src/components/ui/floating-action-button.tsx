import React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface FloatingActionButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}

export const FloatingActionButton = ({ 
  icon: Icon, 
  onClick, 
  className,
  variant = 'primary',
  size = 'md',
  tooltip
}: FloatingActionButtonProps) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7'
  };

  const variantClasses = {
    default: 'bg-card hover:bg-accent text-foreground border border-border shadow-lg',
    primary: 'hero-gradient text-white shadow-lg hover:shadow-xl',
    success: 'bg-success hover:bg-success/90 text-success-foreground shadow-lg',
    warning: 'bg-warning hover:bg-warning/90 text-warning-foreground shadow-lg',
    destructive: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg'
  };

  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 z-50",
        sizeClasses[size],
        variantClasses[variant],
        "shadow-card-hover",
        className
      )}
      title={tooltip}
    >
      <Icon className={iconSizes[size]} />
    </Button>
  );
};

export default FloatingActionButton;