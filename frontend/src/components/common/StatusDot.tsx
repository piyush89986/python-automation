import React from 'react';

interface StatusDotProps {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'active' | 'inactive';
  label?: string;
  className?: string;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status, label, className = '' }) => {
  const isGood = status === 'healthy' || status === 'active';
  const isWarning = status === 'degraded';

  const dotColor = isGood
    ? 'bg-emerald-400'
    : isWarning
    ? 'bg-amber-400'
    : 'bg-rose-400';

  const pingColor = isGood
    ? 'bg-emerald-400/50'
    : isWarning
    ? 'bg-amber-400/50'
    : 'bg-rose-400/50';

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative flex h-2.5 w-2.5">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pingColor}`}
        />
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotColor}`} />
      </span>
      {label && <span className="text-xs font-medium text-slate-300 capitalize">{label}</span>}
    </div>
  );
};
