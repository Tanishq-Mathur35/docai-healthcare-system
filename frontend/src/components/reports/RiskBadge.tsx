import { cn } from '@/lib/utils';
import { AlertCircle, ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

interface RiskBadgeProps {
  level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  className?: string;
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const configs = {
    LOW: {
      label: 'Low Risk',
      icon: ShieldCheck,
      classes: 'bg-green-100 text-green-800 border-green-300',
    },
    MODERATE: {
      label: 'Moderate Risk',
      icon: AlertTriangle,
      classes: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    },
    HIGH: {
      label: 'High Risk',
      icon: AlertCircle,
      classes: 'bg-orange-100 text-orange-800 border-orange-300',
    },
    CRITICAL: {
      label: 'Critical / Emergency',
      icon: AlertOctagon,
      classes: 'bg-red-100 text-red-800 border-red-300 animate-pulse',
    },
  };

  const { label, icon: Icon, classes } = configs[level] || configs.LOW;

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border', classes, className)}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
