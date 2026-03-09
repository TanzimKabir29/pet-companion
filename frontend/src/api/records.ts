import { api } from "./client";
import type {
  AnalyzedMedicalRecord,
  MedicalRecord,
  MedicalRecordWithPrescriptions,
  Prescription,
} from "../types";

export const recordsApi = {
  list: (petId: string) =>
    api.get<MedicalRecord[]>(`/pets/${petId}/records`),

  get: (petId: string, recordId: string) =>
    api.get<MedicalRecordWithPrescriptions>(
      `/pets/${petId}/records/${recordId}`
    ),

  create: (
    petId: string,
    data: {
      title: string;
      diagnosis?: string;
      treatment?: string;
      notes?: string;
      record_date: string;
      vet_name?: string;
      prescriptions?: Array<{
        medication_name: string;
        dosage: string;
        frequency: string;
        duration?: string;
        instructions?: string;
      }>;
    }
  ) => api.post<MedicalRecordWithPrescriptions>(`/pets/${petId}/records`, data),

  update: (
    petId: string,
    recordId: string,
    data: Partial<{
      title: string;
      diagnosis: string;
      treatment: string;
      notes: string;
      record_date: string;
      vet_name: string;
    }>
  ) =>
    api.put<MedicalRecord>(`/pets/${petId}/records/${recordId}`, data),

  delete: (petId: string, recordId: string) =>
    api.delete<void>(`/pets/${petId}/records/${recordId}`),

  addPrescription: (
    petId: string,
    recordId: string,
    data: {
      medication_name: string;
      dosage: string;
      frequency: string;
      duration?: string;
      instructions?: string;
    }
  ) =>
    api.post<Prescription>(
      `/pets/${petId}/records/${recordId}/prescriptions`,
      data
    ),

  analyzePhoto: (petId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.upload<{ analyzed: AnalyzedMedicalRecord; photo_url: string }>(
      `/pets/${petId}/records/analyze`,
      form
    );
  },

  attachPhotos: (petId: string, recordId: string, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    return api.upload<{ uploaded: string[] }>(
      `/pets/${petId}/records/${recordId}/photos`,
      form
    );
  },
};
