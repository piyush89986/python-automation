import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100 or higher
  max?: number;
  label?: string;
  subLabel?: string;
  showPercent?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  subLabel,
  showPercent = true,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  let colorClass = 'bg-gradient-to-r from-emerald-500 to-teal-400';
  if (percentage >= 90) {
    colorClass = 'bg-gradient-to-r from-rose-500 to-red-400';
  } else if (percentage >= 70) {
    colorClass = 'bg-gradient-to-r from-amber-500 to-yellow-400';
  }

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
          <span className="text-slate-300">{label}</span>
          <div className="flex items-center gap-2">
            {subLabel && <span className="text-slate-400">{subLabel}</span>}
            {showPercent && (
              <span className={`font-semibold ${percentage >= 90 ? 'text-rose-400' : 'text-slate-200'}`}>
                {percentage.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      )}
      <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/50">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
