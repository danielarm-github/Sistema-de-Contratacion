import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { Profile, Role, Solicitud, Documento, Historial } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

/**
 * Backend returns data wrapped in a "data" property
 */
interface ApiResponse<T> {
  data: T;
  error?: string | { message: string };
}

/**
 * Raw shape of a User as returned by the backend (Prisma User + role include).
 */
interface RawBackendUser {
  id: number;
  name: string | null;
  email: string;
  password?: string;
  role_id: number;
  role?: { id: number; name: string };
}

/**
 * Convert a raw backend User into the frontend Profile shape.
 * Computes `full_name` from `name` and flattens `role.name` → `role`.
 */
function toProfile(raw: RawBackendUser): Profile {
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name,
    full_name: raw.name ?? "",
    role: (raw.role?.name ?? "JEFE") as Role,
    role_id: raw.role_id,
  };
}

/** Create Axios Instance */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/** Request Interceptor for JWT */
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  try {
    const sessionStr = localStorage.getItem("app_session");
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      const token = session.session?.access_token;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (error) {
    console.error("Error reading session from localStorage", error);
  }
  return config;
});

/**
 * Response Interceptor for global HTTP error handling (non-2xx).
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.error ||
      error.message;
    return Promise.reject(new Error(message));
  },
);

/**
 * Handle the standardized ApiResponse format
 */
const handleResponse = <T>(res: AxiosResponse<ApiResponse<T>>): T => {
  const { data } = res;
  if (data.error) {
    const message =
      typeof data.error === "string" ? data.error : data.error.message;
    throw new Error(message);
  }
  return data.data;
};

/**
 * Helper for making typed requests to specific RESTful endpoints.
 */
const request = {
  get: <T>(url: string, config?: any) =>
    axiosInstance.get<ApiResponse<T>>(url, config).then(handleResponse),

  post: <T>(url: string, data?: any, config?: any) =>
    axiosInstance.post<ApiResponse<T>>(url, data, config).then(handleResponse),

  put: <T>(url: string, data?: any, config?: any) =>
    axiosInstance.put<ApiResponse<T>>(url, data, config).then(handleResponse),

  delete: <T = void>(url: string, config?: any) =>
    axiosInstance.delete<ApiResponse<T>>(url, config).then(handleResponse),
};

/** Main API wrapper */
export const api = {
  auth: {
    /** GET /api/auth/me — backend returns { user } (no session) */
    me: async (): Promise<{ user: Profile }> => {
      const raw = await request.get<{ user: RawBackendUser }>("/auth/me");
      return { user: toProfile(raw.user) };
    },

    /** POST /api/auth/login — backend returns { user, session } */
    login: async (
      credentials: Record<string, string>,
    ): Promise<{ user: Profile; session: { access_token: string } }> => {
      const raw = await request.post<{
        user: RawBackendUser;
        session: { access_token: string };
      }>("/auth/login", credentials);
      return { user: toProfile(raw.user), session: raw.session };
    },
  },

  solicitudes: {
    list: (filters?: {
      estado?: string;
      estado_in?: string[];
    }): Promise<Solicitud[]> => {
      const params: Record<string, string> = {};
      if (filters?.estado) params.estado = filters.estado;
      else if (filters?.estado_in)
        params.estado_in = filters.estado_in.join(",");
      return request.get<Solicitud[]>("/solicitudes", { params });
    },
    get: (id: string): Promise<Solicitud> =>
      request.get<Solicitud>(`/solicitudes/${id}`),
    create: (data: Partial<Solicitud>): Promise<Solicitud> =>
      request.post<Solicitud>("/solicitudes", data),
    update: (id: string, data: Partial<Solicitud>): Promise<Solicitud> =>
      request.put<Solicitud>(`/solicitudes/${id}`, data),
    delete: (id: string): Promise<void> =>
      request.delete<void>(`/solicitudes/${id}`),
  },

  documentos: {
    listBySolicitudId: (solicitudId: string): Promise<Documento[]> =>
      request.get<Documento[]>(`/documentos/solicitud/${solicitudId}`),
    create: (data: Partial<Documento>): Promise<Documento> =>
      request.post<Documento>("/documentos", data),
    delete: (id: string): Promise<void> =>
      request.delete<void>(`/documentos/${id}`),
    upload: async (
      storagePath: string,
      file: File | Blob,
    ): Promise<{ path: string }> => {
      const formData = new FormData();
      formData.append(
        "file",
        file instanceof File ? file : new File([file], "upload"),
      );
      formData.append("path", storagePath);
      return request.post<{ path: string }>("/storage/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
  },

  historial: {
    listBySolicitudId: (solicitudId: string): Promise<Historial[]> =>
      request.get<Historial[]>(`/historial/solicitud/${solicitudId}`),
    create: (data: Partial<Historial>): Promise<Historial> =>
      request.post<Historial>("/historial", data),
  },

  profiles: {
    get: (id: number): Promise<Profile> =>
      request.get<Profile>(`/users/${id}`),
    list: (): Promise<Profile[]> => request.get<Profile[]>("/users"),
    update: (id: number, data: Partial<Profile>): Promise<Profile> =>
      request.put<Profile>(`/users/${id}`, data),
  },

  storage: {
    getSignedUrl: (storagePath: string): Promise<string> =>
      request
        .get<{ signedUrl: string }>(`/storage/url`, {
          params: { path: storagePath },
        })
        .then((res) => res.signedUrl),
  },
};
