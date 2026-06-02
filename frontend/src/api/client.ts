import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const client = axios.create({ baseURL: "/api/v1", withCredentials: true });

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = axios
          .post<{ access_token: string; user: { id: string; email: string; display_name: string } }>(
            "/api/v1/auth/refresh",
            {},
            { withCredentials: true }
          )
          .then((res) => {
            useAuthStore.getState().setAuth(res.data.access_token, res.data.user);
            return res.data.access_token;
          })
          .catch(() => {
            useAuthStore.getState().clearAuth();
            return null;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }
      const newToken = await refreshPromise;
      if (!newToken) return Promise.reject(error);
      original.headers.Authorization = `Bearer ${newToken}`;
      return client(original);
    }
    return Promise.reject(error);
  }
);

export default client;
