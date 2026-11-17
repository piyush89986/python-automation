export type ChannelPlatform = 'instagram' | 'whatsapp';

export interface Bot {
  id: string;
  name: string;
  platform: ChannelPlatform;
  status: 'active' | 'paused' | 'draft';
  model: string;
  temperature: number;
  system_prompt: string;
  rag_enabled: boolean;
  total_conversations: number;
  last_active: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  file_name: string;
  size_kb: number;
  chunks_count: number;
  status: 'indexed' | 'indexing' | 'failed';
  uploaded_at: string;
}

export interface ChannelIntegration {
  platform: ChannelPlatform;
  connected: boolean;
  account_name?: string;
  account_id?: string;
  webhook_url: string;
  verify_token: string;
  last_event_at?: string;
}
