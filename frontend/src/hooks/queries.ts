import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Solicitud, Historial } from '../types';

export const queryKeys = {
  solicitudes: ['solicitudes'] as const,
  solicitud: (id: string) => ['solicitud', id] as const,
  documentos: (solicitudId: string) => ['documentos', solicitudId] as const,
  historial: (solicitudId: string) => ['historial', solicitudId] as const,
  profile: (id: string) => ['profile', id] as const,
};

// ── Solicitudes ─────────────────────────────────────────────────────────────
export function useSolicitudes(opts?: { eq?: { col: string; val: unknown }; in?: { col: string; vals: unknown[] } }) {
  return useQuery({
    queryKey: [...queryKeys.solicitudes, opts],
    queryFn: () => api.query<Solicitud[]>({
      table: 'solicitudes',
      method: 'select',
      q_order: 'created_at',
      q_order_asc: false,
      q_eq: opts?.eq,
      q_in: opts?.in,
    }),
  });
}

export function useSolicitud(id?: string) {
  return useQuery({
    queryKey: queryKeys.solicitud(id!),
    queryFn: () => api.solicitudes.get(id!),
    enabled: !!id,
  });
}

export function useCreateSolicitud() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Solicitud>) => api.solicitudes.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.solicitudes });
    },
  });
}

export function useUpdateSolicitud() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Solicitud> }) => api.solicitudes.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.solicitudes });
      queryClient.invalidateQueries({ queryKey: queryKeys.solicitud(id) });
    },
  });
}

// ── Documentos ──────────────────────────────────────────────────────────────
export function useDocumentos(solicitudId?: string) {
  return useQuery({
    queryKey: queryKeys.documentos(solicitudId!),
    queryFn: () => api.documentos.listBySolicitudId(solicitudId!),
    enabled: !!solicitudId,
  });
}

export function useDeleteDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.documentos.delete(id),
    onSuccess: () => {
      // Invalidate all documentos queries (easier since we might not know solicitudId contextually)
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
    },
  });
}

// ── Historial ───────────────────────────────────────────────────────────────
export function useHistorial(solicitudId?: string) {
  return useQuery({
    queryKey: queryKeys.historial(solicitudId!),
    queryFn: () => api.historial.listBySolicitudId(solicitudId!),
    enabled: !!solicitudId,
  });
}

export function useCreateHistorial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Historial>) => api.historial.create(data),
    onSuccess: (_, variables) => {
      if (variables.solicitud_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.historial(variables.solicitud_id) });
      }
    },
  });
}

// ── Perfil ──────────────────────────────────────────────────────────────────
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { full_name: string } }) => 
      api.query({
        table: 'profiles',
        method: 'update',
        q_eq: { col: 'id', val: id },
        payload: data
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(id) });
    },
  });
}
