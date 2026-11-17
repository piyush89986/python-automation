import React, { useEffect, useState, useCallback } from 'react';
import { businessesApi } from '../../api/businesses';
import type { Business, PlanTier } from '../../types/business';
import type { PaginationMeta } from '../../types/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input, Select } from '../../components/common/Input';
import { StatusDot } from '../../components/common/StatusDot';
import { PlanTierBadge } from '../../components/business/PlanTierBadge';
import { CreateBusinessModal } from '../../components/business/CreateBusinessModal';
import { EditBusinessModal } from '../../components/business/EditBusinessModal';
import { BusinessUsageModal } from '../../components/business/BusinessUsageModal';
import {
  Building2,
  Plus,
  Search,
  BarChart3,
  Edit2,
  PowerOff,
  ChevronLeft,
  ChevronRight,
  Bot,
  FileText,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const BusinessesList: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });

  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [usageBusiness, setUsageBusiness] = useState<Business | null>(null);

  const fetchBusinesses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await businessesApi.listBusinesses({
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() ? search.trim() : undefined,
        plan_tier: selectedTier !== 'all' ? (selectedTier as PlanTier) : undefined,
        is_active: selectedStatus === 'all' ? undefined : selectedStatus === 'active',
      });
      setBusinesses(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error('Failed to load businesses:', err);
      setError('Could not retrieve organizations list.');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, selectedTier, selectedStatus]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const handleDeactivate = async (biz: Business) => {
    if (!biz.is_active) {
      // Reactivate by patch
      try {
        await businessesApi.updateBusiness(biz.id, { is_active: true });
        fetchBusinesses();
      } catch (err) {
        console.error('Failed to reactivate:', err);
      }
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to deactivate organization "${biz.name}"? Active bots will be paused.`
      )
    ) {
      try {
        await businessesApi.deactivateBusiness(biz.id);
        fetchBusinesses();
      } catch (err) {
        console.error('Failed to deactivate business:', err);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-indigo-400" />
            Tenants & Organizations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Provision, monitor quotas, and govern multi-tenant client organizations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchBusinesses}
            isLoading={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Tenant
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by business name or slug..."
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            />
          </div>

          <div>
            <Select
              value={selectedTier}
              onChange={(e) => {
                setSelectedTier(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              options={[
                { value: 'all', label: 'All Plan Tiers' },
                { value: 'free', label: 'Free' },
                { value: 'starter', label: 'Starter' },
                { value: 'pro', label: 'Pro' },
                { value: 'enterprise', label: 'Enterprise' },
              ]}
            />
          </div>

          <div>
            <Select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active Only' },
                { value: 'inactive', label: 'Deactivated Only' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Businesses Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Organization</th>
                <th className="py-3.5 px-4">Tier</th>
                <th className="py-3.5 px-4">Monthly Messages</th>
                <th className="py-3.5 px-4">Capacity</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {businesses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    {isLoading ? 'Loading organizations...' : 'No business organizations found.'}
                  </td>
                </tr>
              ) : (
                businesses.map((biz) => {
                  const msgPercent = Math.min(
                    100,
                    Math.round(
                      (biz.current_month_messages / Math.max(1, biz.max_messages_per_month)) * 100
                    )
                  );
                  return (
                    <tr key={biz.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-slate-100">{biz.name}</p>
                          <p className="text-xs font-mono text-slate-400 mt-0.5">/{biz.slug}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <PlanTierBadge tier={biz.plan_tier} size="sm" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="w-36">
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>{biz.current_month_messages.toLocaleString()}</span>
                            <span>{biz.max_messages_per_month.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                msgPercent > 90 ? 'bg-rose-500' : 'bg-indigo-500'
                              }`}
                              style={{ width: `${msgPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1" title="Max Bots">
                            <Bot className="w-3.5 h-3.5 text-slate-500" />
                            {biz.max_bots}
                          </span>
                          <span className="flex items-center gap-1" title="Max Documents">
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            {biz.max_documents}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <StatusDot
                          status={biz.is_active ? 'active' : 'inactive'}
                          label={biz.is_active ? 'Active' : 'Inactive'}
                        />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setUsageBusiness(biz)}
                            title="Inspect Quota & Usage"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingBusiness(biz)}
                            title="Edit Organization Settings"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeactivate(biz)}
                            title={biz.is_active ? 'Deactivate Tenant' : 'Reactivate Tenant'}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              biz.is_active
                                ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                                : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                            }`}
                          >
                            <PowerOff className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {businesses.length} of {pagination.total} tenants
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>
              <span className="px-2 font-medium text-slate-200">
                {pagination.page} / {pagination.pages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateBusinessModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchBusinesses}
      />

      <EditBusinessModal
        key={editingBusiness?.id || 'none'}
        business={editingBusiness}
        isOpen={!!editingBusiness}
        onClose={() => setEditingBusiness(null)}
        onSuccess={fetchBusinesses}
      />

      <BusinessUsageModal
        key={usageBusiness?.id || 'none'}
        business={usageBusiness}
        isOpen={!!usageBusiness}
        onClose={() => setUsageBusiness(null)}
      />
    </div>
  );
};
