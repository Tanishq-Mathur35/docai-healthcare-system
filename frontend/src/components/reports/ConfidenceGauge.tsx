interface ConfidenceGaugeProps {
  score: number; // 0.0 to 1.0
}

export function ConfidenceGauge({ score }: ConfidenceGaugeProps) {
  const percentage = Math.round(score * 100);

  const getColor = (pct: number) => {
    if (pct >= 80) return 'text-green-600 bg-green-500';
    if (pct >= 60) return 'text-blue-600 bg-blue-500';
    return 'text-amber-600 bg-amber-500';
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground font-medium">Diagnostic Confidence</span>
        <span className="font-bold">{percentage}%</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColor(percentage).split(' ')[1]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
