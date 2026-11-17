import React from 'react';
import { useAuth } from '../../context';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { PlanTierBadge } from '../../components/business/PlanTierBadge';
import {
  Settings,
  Building2,
  User,
  CheckCircle,
} from 'lucide-react';

export const TenantSettings: React.FC = () => {
  const { business, user } = useAuth();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-indigo-400" />
          Organization & Profile Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review your tenant profile, subscription quotas, and account administrator credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Organization Info */}
        <Card className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">Organization Profile</h3>
              <p className="text-xs text-slate-400">Tenant identifier & plan tier</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Company Name</span>
              <span className="font-medium text-slate-100">{business?.name || '---'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">URL Slug</span>
              <span className="font-mono text-xs text-indigo-400">/{business?.slug || '---'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Subscription Tier</span>
              <PlanTierBadge tier={business?.plan_tier || 'free'} size="sm" />
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Tenant ID</span>
              <span className="font-mono text-[11px] text-slate-500">{business?.id || '---'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-400">Operational Status</span>
              <Badge variant={business?.is_active ? 'success' : 'danger'} size="sm">
                {business?.is_active ? 'Active & Operational' : 'Deactivated'}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Administrator Profile */}
        <Card className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">Client Administrator</h3>
              <p className="text-xs text-slate-400">Authenticated user identity</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Full Name</span>
              <span className="font-medium text-slate-100">{user?.full_name || '---'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Email Address</span>
              <span className="font-mono text-xs text-slate-300">{user?.email || '---'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Assigned Role</span>
              <Badge variant="info" size="sm">
                Business Admin
              </Badge>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-400">Auth Token</span>
              <span className="font-mono text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Valid JWT Session
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
