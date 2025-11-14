import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { getErrorTitle } from '@/utils/errorMessages';

interface ErrorAlertProps {
  error: string;
  onRetry?: () => void;
  showRetryButton?: boolean;
  className?: string;
}

export default function ErrorAlert({ 
  error, 
  onRetry, 
  showRetryButton = true,
  className 
}: ErrorAlertProps) {
  return (
    <Alert variant="warning" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{getErrorTitle(error)}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{error}</p>
        <p className="text-xs text-orange-500">
          Silakan periksa koneksi internet Anda dan coba lagi.
        </p>
        {showRetryButton && onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="mt-3 border-teal-300 text-teal-700 hover:bg-teal-50"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Coba Lagi
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
