import { apiClient } from './client';
import type { StandardResponse } from '../types/api';

export interface ProductItem {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string;
  link_url: string;
  in_stock: boolean;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductCreatePayload {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  image_url: string;
  link_url: string;
  in_stock?: boolean;
  category?: string;
}

export interface ProductUpdatePayload {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  image_url?: string;
  link_url?: string;
  in_stock?: boolean;
  category?: string;
}

export const productsApi = {
  async list(params?: { search?: string; category?: string; in_stock_only?: boolean }): Promise<StandardResponse<ProductItem[]>> {
    const res = await apiClient.get<StandardResponse<ProductItem[]>>('/api/v1/products', { params });
    return res.data;
  },

  async create(payload: ProductCreatePayload): Promise<StandardResponse<ProductItem>> {
    const res = await apiClient.post<StandardResponse<ProductItem>>('/api/v1/products', payload);
    return res.data;
  },

  async update(id: string, payload: ProductUpdatePayload): Promise<StandardResponse<ProductItem>> {
    const res = await apiClient.patch<StandardResponse<ProductItem>>(`/api/v1/products/${id}`, payload);
    return res.data;
  },

  async delete(id: string): Promise<StandardResponse<{ deleted: boolean }>> {
    const res = await apiClient.delete<StandardResponse<{ deleted: boolean }>>(`/api/v1/products/${id}`);
    return res.data;
  },
};
