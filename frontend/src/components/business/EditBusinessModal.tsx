import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input, Select } from '../common/Input';
import { Button } from '../common/Button';
import type { Business, PlanTier, BusinessUpdatePayload } from '../../types/business';
import { businessesApi } from '../../api/businesses';
import { AlertCircle } from 'lucide-react';

interface EditBusinessModalProps {
  business: Business | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditBusinessModal: React.FC<EditBusinessModalProps> = ({
  business,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState(business?.name || '');
  const [planTier, setPlanTier] = useState<PlanTier>(business?.plan_tier || 'free');
  const [maxBots, setMaxBots] = useState<number>(business?.max_bots || 1);
  const [maxMessages, setMaxMessages] = useState<number>(business?.max_messages_per_month || 1000);
  const [maxDocs, setMaxDocs] = useState<number>(business?.max_documents || 5);
  const [isActive, setIsActive] = useState<boolean>(business?.is_active ?? true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    setError(null);
    setIsLoading(true);

    try {
      const payload: BusinessUpdatePayload = {
        name: name.trim(),
        plan_tier: planTier,
        max_bots: Number(maxBots),
        max_messages_per_month: Number(maxMessages),
        max_documents: Number(maxDocs),
        is_active: isActive,
      };

      await businessesApi.updateBusiness(business.id, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to update business:', err);
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to update business.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configure ${business?.name || 'Business'}`}
      subtitle="Modify organization subscription tier, operational quotas, or active state."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2.5 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Organization Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Select
          label="Subscription Plan Tier"
          value={planTier}
          onChange={(e) => setPlanTier(e.target.value as PlanTier)}
          options={[
            { value: 'free', label: 'Free' },
            { value: 'starter', label: 'Starter' },
            { value: 'pro', label: 'Pro' },
            { value: 'enterprise', label: 'Enterprise' },
          ]}
        />

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Max Bots"
            type="number"
            min={1}
            value={maxBots}
            onChange={(e) => setMaxBots(Number(e.target.value))}
            required
          />
          <Input
            label="Monthly Msgs"
            type="number"
            min={100}
            value={maxMessages}
            onChange={(e) => setMaxMessages(Number(e.target.value))}
            required
          />
          <Input
            label="Max Docs"
            type="number"
            min={1}
            value={maxDocs}
            onChange={(e) => setMaxDocs(Number(e.target.value))}
            required
          />
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span className="text-sm font-medium text-slate-300">
              Active Organization (Access enabled)
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
