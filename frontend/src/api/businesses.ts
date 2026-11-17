import { apiClient } from './client';
import type {
  Business,
  BusinessCreatePayload,
  BusinessFilterParams,
  BusinessUpdatePayload,
  BusinessUsage,
} from '../types/business';
import type { PaginatedResponse, StandardResponse } from '../types/api';

export const businessesApi = {
  async listBusinesses(
    params?: BusinessFilterParams
  ): Promise<PaginatedResponse<Business>> {
    const queryParams: Record<string, any> = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.search) queryParams.search = params.search;
    if (params?.is_active !== undefined) queryParams.is_active = params.is_active;
    if (params?.plan_tier) queryParams.plan_tier = params.plan_tier;

    const response = await apiClient.get<PaginatedResponse<Business>>(
      '/api/v1/businesses',
      { params: queryParams }
    );
    return response.data;
  },

  async createBusiness(
    payload: BusinessCreatePayload
  ): Promise<StandardResponse<Business>> {
    const response = await apiClient.post<StandardResponse<Business>>(
      '/api/v1/businesses',
      payload
    );
    return response.data;
  },

  async getBusiness(id: string): Promise<StandardResponse<Business>> {
    const response = await apiClient.get<StandardResponse<Business>>(
      `/api/v1/businesses/${id}`
    );
    return response.data;
  },

  async getBusinessUsage(id: string): Promise<StandardResponse<BusinessUsage>> {
    const response = await apiClient.get<StandardResponse<BusinessUsage>>(
      `/api/v1/businesses/${id}/usage`
    );
    return response.data;
  },

  async updateBusiness(
    id: string,
    payload: BusinessUpdatePayload
  ): Promise<StandardResponse<Business>> {
    const response = await apiClient.patch<StandardResponse<Business>>(
      `/api/v1/businesses/${id}`,
      payload
    );
    return response.data;
  },

  async deactivateBusiness(
    id: string
  ): Promise<StandardResponse<{ id: string; is_active: boolean }>> {
    const response = await apiClient.delete<
      StandardResponse<{ id: string; is_active: boolean }>
    >(`/api/v1/businesses/${id}`);
    return response.data;
  },
};
