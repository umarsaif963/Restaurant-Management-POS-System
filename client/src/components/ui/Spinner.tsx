import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className = '' }: SpinnerProps) {
  return <Loader2 className={`h-5 w-5 animate-spin ${className}`} aria-label="Loading" />;
}