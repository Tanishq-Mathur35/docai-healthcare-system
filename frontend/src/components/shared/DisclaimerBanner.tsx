import { AlertTriangle } from 'lucide-react';

export function DisclaimerBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-800">Medical Disclaimer</p>
        <p className="text-sm text-amber-700 mt-1">
          This AI-generated content is for informational purposes only and does NOT constitute medical advice,
          diagnosis, or treatment. Always consult a qualified healthcare professional. In an emergency, call
          your local emergency services immediately.
        </p>
      </div>
    </div>
  );
}
