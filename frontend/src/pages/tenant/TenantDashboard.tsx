import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context';
import { businessesApi } from '../../api/businesses';
import type { BusinessUsage } from '../../types/business';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { PlanTierBadge } from '../../components/business/PlanTierBadge';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Link } from 'react-router-dom';
import {
  Bot,
  MessageSquare,
  FileText,
  Share2,
  ArrowRight,
  TrendingUp,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const TenantDashboard: React.FC = () => {
  const { business, user } = useAuth();
  const [usage, setUsage] = useState<BusinessUsage | null>(null);

  useEffect(() => {
    if (business?.id) {
      businessesApi
        .getBusinessUsage(business.id)
        .then((res) => setUsage(res.data))
        .catch((err) => console.error('Failed to get usage:', err));
    }
  }, [business?.id]);

  const messagesUsed = usage?.messages_used ?? business?.current_month_messages ?? 0;
  const messagesLimit = usage?.messages_limit ?? business?.max_messages_per_month ?? 1000;
  const botsLimit = usage?.bots_limit ?? business?.max_bots ?? 1;
  const docsLimit = usage?.documents_limit ?? 5;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome & Organization Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/20 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">
                Workspace Dashboard
              </span>
              <PlanTierBadge tier={business?.plan_tier || 'free'} size="sm" />
              {business?.is_active && (
                <Badge variant="success" size="sm">
                  Active
                </Badge>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
              {business?.name || 'My Organization'}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Welcome back, <span className="text-white font-medium">{user?.full_name}</span>. Manage your AI chatbots, vector knowledge base, and Meta omnichannel messaging.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/bots">
              <Button variant="primary" leftIcon={<Bot className="w-4 h-4" />}>
                Manage AI Bots
              </Button>
            </Link>
            <Link to="/channels">
              <Button variant="secondary" leftIcon={<Share2 className="w-4 h-4" />}>
                Integrations
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Consumption & Quota KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Messages Card */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Monthly Messages
            </span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100">
                {messagesUsed.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">
                / {messagesLimit.toLocaleString()} limit
              </span>
            </div>
            <ProgressBar
              value={messagesUsed}
              max={messagesLimit}
              className="mt-3"
              showPercent={true}
            />
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Quota resets on the 1st of each month
          </p>
        </Card>

        {/* AI Bots Card */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              AI Bots Capacity
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100">
                {usage?.bots_used ?? 1}
              </span>
              <span className="text-xs text-slate-400">/ {botsLimit} allowed</span>
            </div>
            <ProgressBar
              value={usage?.bots_used ?? 1}
              max={botsLimit}
              className="mt-3"
              showPercent={false}
            />
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Instagram & WhatsApp ready
          </p>
        </Card>

        {/* Knowledge Documents Card */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Knowledge Base (RAG)
            </span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100">
                {usage?.documents_used ?? 2}
              </span>
              <span className="text-xs text-slate-400">/ {docsLimit} documents</span>
            </div>
            <ProgressBar
              value={usage?.documents_used ?? 2}
              max={docsLimit}
              className="mt-3"
              showPercent={false}
            />
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            Pinecone 1536-dim embeddings active
          </p>
        </Card>
      </div>

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bots & Automation */}
        <Card className="space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-100">AI Assistants</h3>
              </div>
              <Badge variant="success" size="sm">
                Operational
              </Badge>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Configure system prompts, adjust hallucination control (temperature 0.1), and connect bots to your live Instagram DM and WhatsApp channels.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Powered by OpenAI & Gemini</span>
            <Link
              to="/bots"
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Configure Bots <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

        {/* Knowledge Base */}
        <Card className="space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-100">Vector Knowledge Base</h3>
              </div>
              <Badge variant="info" size="sm">
                RAG Synced
              </Badge>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Upload customer support documents, product pricing, and business policies. Embeddings are indexed automatically to give accurate, grounded answers.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Top-k: 4 &bull; Score &ge; 0.72</span>
            <Link
              to="/knowledge"
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Upload Documents <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
