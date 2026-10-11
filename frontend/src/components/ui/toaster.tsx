import { useNotificationStore } from '@/store/notificationStore';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export function Toaster() {
  const { toasts, removeToast } = useNotificationStore();
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all animate-in slide-in-from-bottom-2',
            toast.variant === 'destructive' && 'border-red-200 bg-red-50 text-red-900',
            toast.variant === 'success' && 'border-green-200 bg-green-50 text-green-900',
            toast.variant === 'default' && 'border-border bg-background text-foreground'
          )}
        >
          {toast.variant === 'destructive' && <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />}
          {toast.variant === 'success' && <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />}
          {toast.variant === 'default' && <Info className="h-5 w-5 flex-shrink-0 text-blue-500" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.description && <p className="text-sm opacity-80 mt-0.5">{toast.description}</p>}
          </div>
          <button onClick={() => removeToast(toast.id)} className="flex-shrink-0 opacity-60 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
