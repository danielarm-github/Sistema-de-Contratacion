import { useState } from 'react';
import { Eye, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Solicitud } from '../types';
import StatusBadge from './StatusBadge';
import ConfirmModal from './ConfirmModal';
import { useRouter } from '../contexts/RouterContext';
import { useAuth } from '../contexts/AuthContext';
import { useDeleteSolicitud } from '../hooks/queries';

interface Props {
  solicitudes: Solicitud[];
  loading?: boolean;
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ApplicationTable({ solicitudes, loading }: Props) {
  const { navigate } = useRouter();
  const { profile } = useAuth();
  const deleteSolicitud = useDeleteSolicitud();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!solicitudes.length) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Eye size={24} className="text-slate-400" />
        </div>
        <p className="text-slate-500 font-medium">No hay solicitudes</p>
        <p className="text-slate-400 text-sm mt-1">Las solicitudes aparecerán aquí</p>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteSolicitud.mutateAsync(deletingId);
      setDeletingId(null);
    } catch (err) {
      console.error('Error deleting solicitud', err);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5 uppercase tracking-wide">ID</th>
            <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5 uppercase tracking-wide">Profesor</th>
            <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5 uppercase tracking-wide">CI</th>
            <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5 uppercase tracking-wide">Estado</th>
            <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5 uppercase tracking-wide text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {solicitudes.map(s => {
            const isDraft = s.estado === 'DRAFT';
            const canManage = profile?.role === 'JEFE' && isDraft;

            return (
              <tr
                key={s.id}
                onClick={() => navigate(`/solicitudes/${s.id}`)}
                className="hover:bg-slate-50 cursor-pointer transition-colors group"
              >
                <td className="px-5 py-4 text-slate-400 font-mono text-xs">{s.id.slice(0, 8)}…</td>
                <td className="px-5 py-4">
                  <p className="text-slate-800 font-medium">{s.nombres_apellidos || '—'}</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">{formatDate(s.created_at)}</p>
                </td>
                <td className="px-5 py-4 text-slate-600">{s.ci || '—'}</td>
                <td className="px-5 py-4"><StatusBadge estado={s.estado} size="sm" /></td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/solicitudes/${s.id}`); }}
                      title="Ver Detalles"
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Eye size={16} />
                    </button>

                    {canManage && (
                      <>
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/solicitudes/nueva?id=${s.id}`); }}
                          title="Editar Borrador"
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setDeletingId(s.id); }}
                          title="Eliminar Borrador"
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {deletingId && (
        <ConfirmModal
          title="Eliminar Borrador"
          message="¿Está seguro de que desea eliminar este borrador? Esta acción no se puede deshacer."
          confirmLabel="Sí, eliminar"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
