import { api } from "./client";
import type { Pet } from "../types";

export const petsApi = {
  list: () => api.get<Pet[]>("/pets"),

  get: (petId: string) => api.get<Pet>(`/pets/${petId}`),

  create: (data: {
    name: string;
    species: string;
    breed?: string;
    date_of_birth?: string;
    weight_kg?: number;
    gender?: string;
    color?: string;
    microchip_id?: string;
    notes?: string;
  }) => api.post<Pet>("/pets", data),

  update: (
    petId: string,
    data: Partial<{
      name: string;
      species: string;
      breed: string;
      date_of_birth: string;
      weight_kg: number;
      gender: string;
      color: string;
      microchip_id: string;
      photo_url: string;
      notes: string;
    }>
  ) => api.put<Pet>(`/pets/${petId}`, data),

  delete: (petId: string) => api.delete<void>(`/pets/${petId}`),

  uploadPhoto: (petId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.upload<{ url: string }>(`/pets/${petId}/photo`, form);
  },
};
