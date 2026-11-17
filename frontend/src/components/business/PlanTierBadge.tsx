import React from 'react';
import { Badge } from '../common/Badge';
import type { PlanTier } from '../../types/business';
import { Zap, Sparkles, ShieldCheck, Crown } from 'lucide-react';

interface PlanTierBadgeProps {
  tier: PlanTier | string;
  size?: 'sm' | 'md';
}

export const PlanTierBadge: React.FC<PlanTierBadgeProps> = ({ tier, size = 'md' }) => {
  const normalized = (tier || 'free').toLowerCase();

  switch (normalized) {
    case 'enterprise':
      return (
        <Badge variant="primary" size={size} className="bg-purple-500/10 text-purple-400 border-purple-500/30">
          <Crown className="w-3 h-3" />
          Enterprise
        </Badge>
      );
    case 'pro':
      return (
        <Badge variant="info" size={size}>
          <ShieldCheck className="w-3 h-3" />
          Pro
        </Badge>
      );
    case 'starter':
      return (
        <Badge variant="success" size={size}>
          <Sparkles className="w-3 h-3" />
          Starter
        </Badge>
      );
    case 'free':
    default:
      return (
        <Badge variant="neutral" size={size}>
          <Zap className="w-3 h-3" />
          Free
        </Badge>
      );
  }
};
