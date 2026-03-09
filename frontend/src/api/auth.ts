import { api } from "./client";
import type { AuthResponse, User, UserType } from "../types";

export const authApi = {
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    user_type: UserType;
    phone?: string;
  }) => api.post<AuthResponse>("/auth/register", data),

  login: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/login", { email, password }),

  me: () => api.get<User>("/auth/me"),
};
