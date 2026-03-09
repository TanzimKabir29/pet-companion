import { api } from "./client";
import type { PetShop, ShopService, ShopWithServices } from "../types";

export const shopsApi = {
  list: () => api.get<PetShop[]>("/shops"),

  get: (shopId: string) => api.get<ShopWithServices>(`/shops/${shopId}`),

  myShop: () => api.get<ShopWithServices | undefined>("/shops/my"),

  create: (data: {
    name: string;
    description?: string;
    address?: string;
    city?: string;
    phone?: string;
    website?: string;
    hours?: Record<string, string>;
  }) => api.post<PetShop>("/shops", data),

  update: (
    shopId: string,
    data: Partial<{
      name: string;
      description: string;
      address: string;
      city: string;
      phone: string;
      website: string;
      hours: Record<string, string>;
      is_active: boolean;
    }>
  ) => api.put<PetShop>(`/shops/${shopId}`, data),

  delete: (shopId: string) => api.delete<void>(`/shops/${shopId}`),

  addService: (
    shopId: string,
    data: {
      name: string;
      description?: string;
      price?: number;
      category?: string;
    }
  ) => api.post<ShopService>(`/shops/${shopId}/services`, data),

  updateService: (
    shopId: string,
    serviceId: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      category: string;
    }>
  ) => api.put<ShopService>(`/shops/${shopId}/services/${serviceId}`, data),

  deleteService: (shopId: string, serviceId: string) =>
    api.delete<void>(`/shops/${shopId}/services/${serviceId}`),

  vetPatients: () => api.get<any[]>("/vet/patients"),

  vetPatient: (petId: string) => api.get<any>(`/vet/patients/${petId}`),
};
