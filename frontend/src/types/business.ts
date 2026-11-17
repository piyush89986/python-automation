export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise';

export interface Business {
  id: string;
  name: string;
  slug: string;
  plan_tier: PlanTier;
  max_bots: number;
  max_messages_per_month: number;
  current_month_messages: number;
  max_documents: number;
  is_active: boolean;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BusinessUsage {
  business_id: string;
  plan_tier: PlanTier;
  messages_used: number;
  messages_limit: number;
  messages_usage_percent: number;
  bots_used: number;
  bots_limit: number;
  documents_used: number;
  documents_limit: number;
}

export interface BusinessCreatePayload {
  name: string;
  slug?: string;
  plan_tier: PlanTier;
  max_bots?: number;
  max_messages_per_month?: number;
  max_documents?: number;
  admin_email: string;
  admin_password: string;
  admin_full_name: string;
}

export interface BusinessUpdatePayload {
  name?: string;
  plan_tier?: PlanTier;
  max_bots?: number;
  max_messages_per_month?: number;
  max_documents?: number;
  is_active?: boolean;
  settings?: Record<string, any>;
}

export interface BusinessFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  plan_tier?: PlanTier;
}
