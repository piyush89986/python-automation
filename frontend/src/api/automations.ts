import { apiClient } from './client';
import type { StandardResponse } from '../types/api';

export interface AutomationWorkflowItem {
  id: string;
  name: string;
  trigger_type: string;
  nodes_graph: any[];
  edges_graph: any[];
  is_active: boolean;
  created_at: string;
}

export interface WorkflowSavePayload {
  name: string;
  trigger_type?: string;
  nodes_graph?: any[];
  edges_graph?: any[];
  is_active?: boolean;
}

export const automationsApi = {
  async list(): Promise<StandardResponse<AutomationWorkflowItem[]>> {
    const res = await apiClient.get<StandardResponse<AutomationWorkflowItem[]>>('/api/v1/automations');
    return res.data;
  },

  async create(payload: WorkflowSavePayload): Promise<StandardResponse<AutomationWorkflowItem>> {
    const res = await apiClient.post<StandardResponse<AutomationWorkflowItem>>('/api/v1/automations', payload);
    return res.data;
  },

  async update(id: string, payload: Partial<WorkflowSavePayload>): Promise<StandardResponse<AutomationWorkflowItem>> {
    const res = await apiClient.patch<StandardResponse<AutomationWorkflowItem>>(`/api/v1/automations/${id}`, payload);
    return res.data;
  },
};
