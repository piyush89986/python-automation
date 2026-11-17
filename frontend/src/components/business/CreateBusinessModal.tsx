import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input, Select } from '../common/Input';
import { Button } from '../common/Button';
import type { PlanTier, BusinessCreatePayload } from '../../types/business';
import { businessesApi } from '../../api/businesses';
import { Building2, User, Lock, Mail, AlertCircle } from 'lucide-react';

interface CreateBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TIER_DEFAULTS = {
  free: { max_bots: 1, max_messages: 1000, max_docs: 5 },
  starter: { max_bots: 3, max_messages: 10000, max_docs: 25 },
  pro: { max_bots: 10, max_messages: 50000, max_docs: 100 },
  enterprise: { max_bots: 100, max_messages: 500000, max_docs: 1000 },
};

export const CreateBusinessModal: React.FC<CreateBusinessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<BusinessCreatePayload>({
    name: '',
    slug: '',
    plan_tier: 'free',
    admin_email: '',
    admin_password: '',
    admin_full_name: '',
  });

  const [customLimits, setCustomLimits] = useState(false);
  const [maxBots, setMaxBots] = useState<number>(1);
  const [maxMessages, setMaxMessages] = useState<number>(1000);
  const [maxDocs, setMaxDocs] = useState<number>(5);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tier = e.target.value as PlanTier;
    setFormData((prev) => ({ ...prev, plan_tier: tier }));
    if (!customLimits) {
      const defaults = TIER_DEFAULTS[tier];
      setMaxBots(defaults.max_bots);
      setMaxMessages(defaults.max_messages);
      setMaxDocs(defaults.max_docs);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload: BusinessCreatePayload = {
        name: formData.name.trim(),
        slug: formData.slug?.trim() ? formData.slug.trim() : undefined,
        plan_tier: formData.plan_tier,
        admin_email: formData.admin_email.trim(),
        admin_password: formData.admin_password,
        admin_full_name: formData.admin_full_name.trim(),
      };

      if (customLimits) {
        payload.max_bots = Number(maxBots);
        payload.max_messages_per_month = Number(maxMessages);
        payload.max_documents = Number(maxDocs);
      }

      await businessesApi.createBusiness(payload);
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        name: '',
        slug: '',
        plan_tier: 'free',
        admin_email: '',
        admin_password: '',
        admin_full_name: '',
      });
      setCustomLimits(false);
    } catch (err: any) {
      console.error('Failed to create business:', err);
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to provision new business organization.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Provision New Business Tenant"
      subtitle="Creates an isolated tenant organization and registers the initial client administrator."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2.5 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Section: Organization Details */}
        <div>
          <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Organization Profile
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Business Name *"
              placeholder="e.g. Acme Corporation"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="URL Slug (Optional)"
              placeholder="e.g. acme-corp"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              helperText="Auto-generated from name if left empty"
            />
          </div>

          <div className="mt-4">
            <Select
              label="Subscription Plan Tier *"
              value={formData.plan_tier}
              onChange={handleTierChange}
              options={[
                { value: 'free', label: 'Free (1 Bot, 1,000 Messages, 5 Docs)' },
                { value: 'starter', label: 'Starter (3 Bots, 10,000 Messages, 25 Docs)' },
                { value: 'pro', label: 'Pro (10 Bots, 50,000 Messages, 100 Docs)' },
                { value: 'enterprise', label: 'Enterprise (100 Bots, 500,000 Messages, 1000 Docs)' },
              ]}
            />
          </div>

          {/* Custom Quotas Toggle */}
          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="customLimitsToggle"
              checked={customLimits}
              onChange={(e) => setCustomLimits(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <label htmlFor="customLimitsToggle" className="text-xs text-slate-300 select-none cursor-pointer">
              Customize quota limits for this tenant
            </label>
          </div>

          {customLimits && (
            <div className="grid grid-cols-3 gap-3 mt-3 p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <Input
                label="Max Bots"
                type="number"
                min={1}
                value={maxBots}
                onChange={(e) => setMaxBots(Number(e.target.value))}
              />
              <Input
                label="Monthly Messages"
                type="number"
                min={100}
                value={maxMessages}
                onChange={(e) => setMaxMessages(Number(e.target.value))}
              />
              <Input
                label="Max Documents"
                type="number"
                min={1}
                value={maxDocs}
                onChange={(e) => setMaxDocs(Number(e.target.value))}
              />
            </div>
          )}
        </div>

        {/* Section: Client Administrator */}
        <div className="pt-2 border-t border-slate-800">
          <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Initial Client Administrator
          </h4>
          <div className="space-y-4">
            <Input
              label="Admin Full Name *"
              placeholder="e.g. John Doe"
              leftIcon={<User className="w-4 h-4" />}
              value={formData.admin_full_name}
              onChange={(e) => setFormData({ ...formData, admin_full_name: e.target.value })}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Admin Email *"
                type="email"
                placeholder="admin@tenant.com"
                leftIcon={<Mail className="w-4 h-4" />}
                value={formData.admin_email}
                onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                required
              />
              <Input
                label="Initial Password *"
                type="password"
                placeholder="Minimum 8 characters"
                leftIcon={<Lock className="w-4 h-4" />}
                value={formData.admin_password}
                onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                minLength={8}
                required
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            Create Organization
          </Button>
        </div>
      </form>
    </Modal>
  );
};
