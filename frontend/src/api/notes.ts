import { api } from "./client";
import type { WellbeingNote } from "../types";

export const notesApi = {
  list: (petId: string) =>
    api.get<WellbeingNote[]>(`/pets/${petId}/notes`),

  create: (
    petId: string,
    data: {
      note: string;
      mood?: string;
      energy_level?: string;
      appetite?: string;
    }
  ) => api.post<WellbeingNote>(`/pets/${petId}/notes`, data),

  delete: (petId: string, noteId: string) =>
    api.delete<void>(`/pets/${petId}/notes/${noteId}`),
};
