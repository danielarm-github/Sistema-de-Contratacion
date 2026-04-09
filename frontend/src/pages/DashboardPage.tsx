import { FileText, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { useRouter } from '../contexts/RouterContext';
import { useSolicitudes } from '../hooks/queries';

export default function DashboardPage() {
  const { profile } = useAuth();
  const { navigate } = useRouter();
  const { data: allSolicitudes, isLoading: loading } = useSolicitudes();
  
  const all = allSolicitudes || [];
  
  const stats = {
    total: all.length,
    draft: all.filter(s => s.estado === 'DRAFT').length,
    submitted: all.filter(s => s.estado === 'SUBMITTED').length,
    signed: all.filter(s => s.estado === 'SIGNED').length,
    generated: all.filter(s => s.estado === 'GENERATED').length,
    completed: all.filter(s => s.estado === 'COMPLETED').length,
  };
  
  const recent = all.slice(0, 5);

  const roleLabel = profile?.role === 'JEFE' ? 'Jefe de Área' : profile?.role === 'RECTOR' ? 'Rector' : 'Recursos Humanos';

  const statCards = [
    { label: 'Total Solicitudes', value: stats.total, icon: <FileText size={20} />, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
    { label: 'En Proceso', value: stats.submitted + stats.signed, icon: <Clock size={20} />, color: 'bg-amber-50 text-amber-600', border: 'border-amber-100' },
    { label: 'Completadas', value: stats.completed, icon: <CheckCircle size={20} />, color: 'bg-green-50 text-green-600', border: 'border-green-100' },
    { label: 'Borradores', value: stats.draft, icon: <AlertCircle size={20} />, color: 'bg-slate-50 text-slate-500', border: 'border-slate-100' },
  ];

  return (
    <Layout title="Dashboard" subtitle={`Bienvenido, ${profile?.full_name ?? ''} — ${roleLabel}`}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(card => (
            <div key={card.label} className={`bg-white rounded-xl border ${card.border} p-5 flex items-center gap-4`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.color}`}>
                {card.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {loading ? <span className="inline-block w-8 h-6 bg-slate-100 rounded animate-pulse" /> : card.value}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-800 font-semibold text-sm">Solicitudes Recientes</h2>
              <button
                onClick={() => navigate('/solicitudes')}
                className="text-blue-600 hover:text-blue-700 text-xs font-medium"
              >
                Ver todas →
              </button>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />)}
              </div>
            ) : recent.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-400 text-sm">No hay solicitudes aún</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recent.map(s => (
                  <div
                    key={s.id}
                    onClick={() => navigate(`/solicitudes/${s.id}`)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200"
                  >
                    <div>
                      <p className="text-slate-800 text-sm font-medium">{s.nombres_apellidos || 'Sin nombre'}</p>
                      <p className="text-slate-400 text-xs mt-0.5">CI: {s.ci || '—'} · {s.departamento || 'Sin departamento'}</p>
                    </div>
                    <StatusBadge estado={s.estado} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-slate-500" />
              <h2 className="text-slate-800 font-semibold text-sm">Distribución de estados</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Borrador', value: stats.draft, total: stats.total, color: 'bg-slate-300' },
                { label: 'Enviada', value: stats.submitted, total: stats.total, color: 'bg-blue-400' },
                { label: 'Firmada', value: stats.signed, total: stats.total, color: 'bg-amber-400' },
                { label: 'Generada', value: stats.generated, total: stats.total, color: 'bg-teal-400' },
                { label: 'Completada', value: stats.completed, total: stats.total, color: 'bg-green-500' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-600 text-xs">{item.label}</span>
                    <span className="text-slate-800 text-xs font-semibold">{item.value}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: item.total > 0 ? `${(item.value / item.total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {profile?.role === 'JEFE' && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold text-lg">Crear nueva solicitud</h3>
              <p className="text-blue-100 text-sm mt-1">Inicia el proceso de contratación para un profesor adjunto</p>
            </div>
            <button
              onClick={() => navigate('/solicitudes/nueva')}
              className="px-5 py-2.5 bg-white text-blue-700 font-semibold text-sm rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              Nueva Solicitud
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
