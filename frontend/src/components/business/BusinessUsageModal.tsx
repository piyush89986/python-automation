import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import type { Business, BusinessUsage } from '../../types/business';
import { businessesApi } from '../../api/businesses';
import { UsageMeter } from './UsageMeter';
import { PlanTierBadge } from './PlanTierBadge';
import { Loader2, AlertCircle } from 'lucide-react';

interface BusinessUsageModalProps {
  business: Business | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BusinessUsageModal: React.FC<BusinessUsageModalProps> = ({
  business,
  isOpen,
  onClose,
}) => {
  const [usage, setUsage] = useState<BusinessUsage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (business && isOpen) {
      setIsLoading(true);
      setError(null);
      businessesApi
        .getBusinessUsage(business.id)
        .then((res) => {
          setUsage(res.data);
        })
        .catch((err) => {
          console.error('Failed to load usage:', err);
          setError('Could not retrieve tenant usage telemetry.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [business, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${business?.name || 'Tenant'} Quotas & Consumption`}
      subtitle={`Tenant ID: ${business?.id || ''}`}
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <p className="text-xs text-slate-400">Subscription Tier</p>
            <div className="mt-1">
              <PlanTierBadge tier={business?.plan_tier || 'free'} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">URL Slug</p>
            <p className="text-sm font-mono text-slate-200 mt-1">/{business?.slug}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <p className="text-sm">Fetching real-time usage metrics...</p>
          </div>
        ) : error ? (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2.5 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        ) : usage ? (
          <UsageMeter usage={usage} />
        ) : null}
      </div>
    </Modal>
  );
};
