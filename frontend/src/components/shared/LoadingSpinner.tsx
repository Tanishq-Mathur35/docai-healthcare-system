import { cn } from '@/lib/utils';

interface LoadingSpinnerProps { className?: string; size?: 'sm' | 'md' | 'lg'; }

export function LoadingSpinner({ className, size = 'md' }: LoadingSpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className={cn('animate-spin rounded-full border-2 border-muted border-t-primary', sizes[size], className)} />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}
