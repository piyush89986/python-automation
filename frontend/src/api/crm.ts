import { apiClient } from './client';
import type { StandardResponse } from '../types/api';

export interface ContactItem {
  id: string;
  business_id: string;
  platform_user_id: string;
  username: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  lead_status: 'LEAD' | 'QUALIFIED' | 'CUSTOMER';
  tags: string[];
  last_interaction_at: string;
  created_at: string;
}

export interface ContactUpdatePayload {
  lead_status?: 'LEAD' | 'QUALIFIED' | 'CUSTOMER';
  tags?: string[];
  full_name?: string;
  email?: string;
  phone?: string;
}

export const crmApi = {
  async list(params?: { lead_status?: string; search?: string }): Promise<StandardResponse<ContactItem[]>> {
    const res = await apiClient.get<StandardResponse<ContactItem[]>>('/api/v1/contacts', { params });
    return res.data;
  },

  async update(id: string, payload: ContactUpdatePayload): Promise<StandardResponse<ContactItem>> {
    const res = await apiClient.patch<StandardResponse<ContactItem>>(`/api/v1/contacts/${id}`, payload);
    return res.data;
  },
};
