import client from "./client";

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export const authApi = {
  register: (data: { email: string; display_name: string; password: string }) =>
    client.post<TokenResponse>("/auth/register", data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    client.post<TokenResponse>("/auth/login", data).then((r) => r.data),

  logout: () => client.post("/auth/logout"),
};
