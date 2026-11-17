import { apiClient } from './client';
import type { StandardResponse } from '../types/api';

export interface InstagramAccountItem {
  id: string;
  meta_account_id: string;
  instagram_account_id: string;
  username: string;
  profile_picture_url: string | null;
  is_active: boolean;
  created_at: string;
}

export const instagramApi = {
  async listAccounts(): Promise<StandardResponse<InstagramAccountItem[]>> {
    const res = await apiClient.get<StandardResponse<InstagramAccountItem[]>>('/api/v1/instagram/accounts');
    return res.data;
  },

  async exchangeToken(shortLivedToken: string): Promise<StandardResponse<{ linked_accounts: any[] }>> {
    const res = await apiClient.post<StandardResponse<{ linked_accounts: any[] }>>('/api/v1/instagram/oauth/callback', {
      access_token: shortLivedToken,
    });
    return res.data;
  },
};
