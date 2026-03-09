export type UserType = "owner" | "vet" | "shop";

export interface User {
  id: string;
  email: string;
  user_type: UserType;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  breed?: string;
  date_of_birth?: string;
  weight_kg?: number;
  gender?: string;
  color?: string;
  microchip_id?: string;
  photo_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: string;
  medical_record_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
  created_at: string;
}

export type RecordSource = "in_app" | "photo_upload";

export interface MedicalRecord {
  id: string;
  pet_id: string;
  created_by: string;
  vet_id?: string;
  vet_name?: string;
  title: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  record_date: string;
  record_source: RecordSource;
  photo_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface MedicalRecordWithPrescriptions extends MedicalRecord {
  prescriptions: Prescription[];
}

export interface WellbeingNote {
  id: string;
  pet_id: string;
  owner_id: string;
  mood?: string;
  energy_level?: string;
  appetite?: string;
  note: string;
  created_at: string;
}

export interface ShopService {
  id: string;
  shop_id: string;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  created_at: string;
}

export interface PetShop {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  website?: string;
  hours?: Record<string, string>;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShopWithServices extends PetShop {
  services: ShopService[];
}

export interface AnalyzedMedicalRecord {
  title: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  record_date?: string;
  vet_name?: string;
  prescriptions: Array<{
    medication_name: string;
    dosage: string;
    frequency: string;
    duration?: string;
    instructions?: string;
  }>;
}

export interface VetPatient {
  id: string;
  name: string;
  species: string;
  breed?: string;
  photo_url?: string;
  owner_name: string;
  owner_email: string;
}

export interface ApiError {
  error: string;
}
