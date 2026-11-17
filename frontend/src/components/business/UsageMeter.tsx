import React from 'react';
import type { BusinessUsage } from '../../types/business';
import { ProgressBar } from '../common/ProgressBar';
import { MessageSquare, Bot, FileText } from 'lucide-react';

interface UsageMeterProps {
  usage: BusinessUsage;
  className?: string;
}

export const UsageMeter: React.FC<UsageMeterProps> = ({ usage, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Monthly Messages */}
      <div className="bg-slate-950/40 p-3.5 rounded-lg border border-slate-800/80">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-300">
          <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
          <span>Monthly Messages</span>
        </div>
        <ProgressBar
          value={usage.messages_used}
          max={Math.max(1, usage.messages_limit)}
          label={`${usage.messages_used.toLocaleString()} / ${usage.messages_limit.toLocaleString()}`}
          showPercent={true}
        />
      </div>

      {/* Bots Quota */}
      <div className="bg-slate-950/40 p-3.5 rounded-lg border border-slate-800/80">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-300">
          <Bot className="w-3.5 h-3.5 text-emerald-400" />
          <span>Active AI Bots</span>
        </div>
        <ProgressBar
          value={usage.bots_used}
          max={Math.max(1, usage.bots_limit)}
          label={`${usage.bots_used} / ${usage.bots_limit} bots`}
          showPercent={true}
        />
      </div>

      {/* Knowledge Documents */}
      <div className="bg-slate-950/40 p-3.5 rounded-lg border border-slate-800/80">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-300">
          <FileText className="w-3.5 h-3.5 text-sky-400" />
          <span>Knowledge Documents (RAG)</span>
        </div>
        <ProgressBar
          value={usage.documents_used}
          max={Math.max(1, usage.documents_limit)}
          label={`${usage.documents_used} / ${usage.documents_limit} docs`}
          showPercent={true}
        />
      </div>
    </div>
  );
};
