import { Eye, ChevronRight } from 'lucide-react';
import { Solicitud } from '../types';
import StatusBadge from './StatusBadge';
import { useRouter } from '../contexts/RouterContext';

interface Props {
  solicitudes: Solicitud[];
  loading?: boolean;
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ApplicationTable({ solicitudes, loading }: Props) {
  const { navigate } = useRouter();

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

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5 uppercase tracking-wide">ID</th>
            <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5 uppercase tracking-wide">Profesor</th>
            <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5 uppercase tracking-wide">CI</th>
            <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5 uppercase tracking-wide">Estado</th>
            <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5 uppercase tracking-wide">Fecha</th>
            <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5 uppercase tracking-wide">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {solicitudes.map(s => (
            <tr
              key={s.id}
              onClick={() => navigate(`/solicitudes/${s.id}`)}
              className="hover:bg-slate-50 cursor-pointer transition-colors group"
            >
              <td className="px-5 py-4 text-slate-400 font-mono text-xs">{s.id.slice(0, 8)}…</td>
              <td className="px-5 py-4">
                <p className="text-slate-800 font-medium">{s.nombres_apellidos || '—'}</p>
                {s.profiles?.full_name && (
                  <p className="text-slate-400 text-xs mt-0.5">Por: {s.profiles.full_name}</p>
                )}
              </td>
              <td className="px-5 py-4 text-slate-600">{s.ci || '—'}</td>
              <td className="px-5 py-4"><StatusBadge estado={s.estado} size="sm" /></td>
              <td className="px-5 py-4 text-slate-500">{formatDate(s.created_at)}</td>
              <td className="px-5 py-4">
                <button
                  onClick={e => { e.stopPropagation(); navigate(`/solicitudes/${s.id}`); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Eye size={13} />
                  Ver
                  <ChevronRight size={12} className="opacity-60" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
