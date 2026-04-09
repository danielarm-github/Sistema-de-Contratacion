import { Profile, Solicitud, Documento, Historial } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/** Retrieve JWT from localStorage */
const getToken = () => {
  try {
    const sessionStr = localStorage.getItem('app_session');
    if (!sessionStr) return null;
    return JSON.parse(sessionStr).session?.access_token;
  } catch {
    return null;
  }
};

/** Authenticated Fetch helper */
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // If sending FormData, do not set Content-Type manually (browser handles boundary)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json();
  if (json.error) {
    throw new Error(typeof json.error === 'string' ? json.error : json.error.message);
  }
  return json.data as T;
}

export interface QueryPayload {
  table: string;
  method: 'select' | 'insert' | 'update' | 'delete';
  payload?: unknown;
  q_eq?: { col: string; val: unknown };
  q_in?: { col: string; vals: unknown[] };
  q_order?: string;
  q_order_asc?: boolean;
  q_single?: boolean;
  q_select?: string;
}

export const api = {
  auth: {
    me: () => fetchApi<{ user: Profile; session: { access_token: string } }>('/auth/me'),
    login: (credentials: Record<string, string>) => fetchApi<{ user: Profile; session: { access_token: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
    register: (payload: Record<string, string>) => fetchApi<{ user: Profile; session: { access_token: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  },
  
  // Generic query implementation bridging to the generic Express POST '/query'
  query: async <T>(payload: QueryPayload): Promise<T> => fetchApi<T>('/query', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Type-safe wrappers calling `/query` on the backend
  solicitudes: {
    list: async (): Promise<Solicitud[]> => api.query<Solicitud[]>({ table: 'solicitudes', method: 'select', q_order: 'created_at', q_order_asc: false }),
    get: async (id: string): Promise<Solicitud> => api.query<Solicitud>({ table: 'solicitudes', method: 'select', q_eq: { col: 'id', val: id }, q_single: true }),
    create: async (data: Partial<Solicitud>): Promise<Solicitud> => api.query<Solicitud>({ table: 'solicitudes', method: 'insert', payload: data }),
    update: async (id: string, data: Partial<Solicitud>): Promise<Solicitud> => api.query<Solicitud>({ table: 'solicitudes', method: 'update', q_eq: { col: 'id', val: id }, payload: data })
  },
  
  documentos: {
    listBySolicitudId: async (solicitudId: string): Promise<Documento[]> => 
      api.query<Documento[]>({ table: 'documentos', method: 'select', q_eq: { col: 'solicitud_id', val: solicitudId }, q_order: 'created_at' }),
    delete: async (id: string): Promise<void> => 
      api.query<void>({ table: 'documentos', method: 'delete', q_eq: { col: 'id', val: id } }),
    upload: async (storagePath: string, file: File | Blob): Promise<{ path: string }> => {
      const formData = new FormData();
      formData.append('file', file instanceof File ? file : new File([file], 'upload'));
      formData.append('path', storagePath);
      return fetchApi('/storage/upload', { method: 'POST', body: formData });
    }
  },

  historial: {
    listBySolicitudId: async (solicitudId: string): Promise<Historial[]> => 
      api.query<Historial[]>({ table: 'historial', method: 'select', q_eq: { col: 'solicitud_id', val: solicitudId }, q_order: 'created_at' }),
    create: async (data: Partial<Historial>): Promise<Historial> => 
      api.query<Historial>({ table: 'historial', method: 'insert', payload: data })
  },

  profiles: {
    get: async (id: string): Promise<Profile> => 
      api.query<Profile>({ table: 'profiles', method: 'select', q_eq: { col: 'id', val: id }, q_single: true }),
    list: async (): Promise<Profile[]> => 
      api.query<Profile[]>({ table: 'profiles', method: 'select' })
  },
  
  storage: {
    getSignedUrl: async (storagePath: string): Promise<string> => {
      const res = await fetchApi<{ signedUrl: string }>(`/storage/url?path=${encodeURIComponent(storagePath)}`);
      return res.signedUrl;
    }
  }
};
