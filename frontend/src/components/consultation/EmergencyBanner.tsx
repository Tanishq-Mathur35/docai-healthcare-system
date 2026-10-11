import { AlertOctagon, PhoneCall } from 'lucide-react';

interface EmergencyBannerProps {
  reason?: string;
}

export function EmergencyBanner({ reason }: EmergencyBannerProps) {
  return (
    <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 shadow-md text-red-900 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-red-600 rounded-lg text-white flex-shrink-0">
          <AlertOctagon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-base text-red-800">EMERGENCY MEDICAL ESCALATION</h3>
          <p className="text-sm mt-1 text-red-700">
            {reason || 'Critical symptoms detected. Immediate emergency medical evaluation is strongly recommended.'}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <a
              href="tel:911"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
            >
              <PhoneCall className="h-4 w-4" /> Call Emergency (911)
            </a>
            <span className="text-xs text-red-600 font-medium">Or proceed to the nearest emergency hospital</span>
          </div>
        </div>
      </div>
    </div>
  );
}
