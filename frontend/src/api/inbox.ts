import { apiClient } from './client';
import type { StandardResponse } from '../types/api';

export interface InboxMessage {
  id: string;
  conversation_id: string;
  source: 'CUSTOMER' | 'AI' | 'AGENT';
  sender_id: string;
  recipient_id: string;
  message_type: 'text' | 'image' | 'generic_template' | 'button_template';
  text_content: string | null;
  payload: any | null;
  mid: string | null;
  status: string;
  created_at: string;
}

export interface ConversationContact {
  id: string;
  ig_username: string | null;
  full_name: string | null;
  profile_pic_url?: string | null;
  avatar_url?: string | null;
  lead_status: 'LEAD' | 'QUALIFIED' | 'CUSTOMER';
  phone: string | null;
  email: string | null;
  tags: string[];
}

export interface ConversationItem {
  id: string;
  business_id: string;
  platform: 'instagram' | 'whatsapp';
  channel_account_id: string;
  customer_identifier: string;
  customer_name: string | null;
  human_takeover: boolean;
  status: 'OPEN' | 'RESOLVED';
  unread_count: number;
  last_message_at: string | null;
  created_at: string;
  contact?: ConversationContact | null;
  messages?: InboxMessage[];
}

export const inboxApi = {
  async listConversations(status?: 'OPEN' | 'RESOLVED'): Promise<StandardResponse<ConversationItem[]>> {
    const params = status ? { status } : {};
    const res = await apiClient.get<StandardResponse<ConversationItem[]>>('/api/v1/inbox/conversations', { params });
    return res.data;
  },

  async getMessages(conversationId: string): Promise<StandardResponse<InboxMessage[]>> {
    const res = await apiClient.get<StandardResponse<InboxMessage[]>>(`/api/v1/inbox/conversations/${conversationId}/messages`);
    return res.data;
  },

  async sendMessage(conversationId: string, text: string): Promise<StandardResponse<InboxMessage>> {
    const res = await apiClient.post<StandardResponse<InboxMessage>>(`/api/v1/inbox/conversations/${conversationId}/messages`, { text });
    return res.data;
  },

  async toggleHumanTakeover(conversationId: string, takeover: boolean): Promise<StandardResponse<ConversationItem>> {
    const res = await apiClient.patch<StandardResponse<ConversationItem>>(`/api/v1/inbox/conversations/${conversationId}/takeover`, { takeover });
    return res.data;
  },

  async updateStatus(conversationId: string, status: 'OPEN' | 'RESOLVED'): Promise<StandardResponse<ConversationItem>> {
    const res = await apiClient.patch<StandardResponse<ConversationItem>>(`/api/v1/inbox/conversations/${conversationId}/status`, { status });
    return res.data;
  },
};
