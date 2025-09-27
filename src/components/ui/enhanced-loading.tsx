import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

interface EnhancedLoadingProps {
  type?: 'default' | 'cards' | 'list' | 'profile' | 'chat';
  className?: string;
}

export const EnhancedLoading = ({ type = 'default', className }: EnhancedLoadingProps) => {
  if (type === 'cards') {
    return (
      <div className={cn("items-grid", className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="card-shadow rounded-lg overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-12 rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-fade-in card-shadow p-6 rounded-lg" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-start space-x-4">
              <Skeleton className="w-16 h-16 rounded-lg" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-24" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'profile') {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="card-shadow p-6 rounded-lg">
          <div className="flex items-start space-x-6">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-36" />
                </div>
                <Skeleton className="h-9 w-20" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
        <div className="items-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card-shadow rounded-lg overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'chat') {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-xs p-3 rounded-lg ${i % 2 === 0 ? 'bg-muted' : 'bg-primary'}`}>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center py-12", className)}>
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <div className="absolute inset-0 animate-pulse-ring w-12 h-12 border-2 border-primary-light rounded-full mx-auto"></div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-3 w-24 mx-auto" />
        </div>
      </div>
    </div>
  );
};

export default EnhancedLoading;