import { Settings } from 'lucide-react';
import Layout from '../components/Layout';
import ApplicationTable from '../components/ApplicationTable';
import { useSolicitudes } from '../hooks/queries';

export default function RHPage() {
  const { data, isLoading: loading } = useSolicitudes({ in: { col: 'estado', vals: ['SIGNED', 'GENERATED'] } });
  const solicitudes = data || [];

  return (
    <Layout title="Generar Contratos" subtitle="Solicitudes firmadas listas para generar contrato">
      <div className="space-y-4">
        {!loading && solicitudes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Settings size={24} className="text-teal-500" />
            </div>
            <p className="text-slate-700 font-medium">No hay contratos pendientes de generar</p>
            <p className="text-slate-400 text-sm mt-1">Las solicitudes firmadas por el Rector aparecerán aquí</p>
          </div>
        ) : (
          <>
            {!loading && (
              <div className="flex items-center gap-2 px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl">
                <Settings size={15} className="text-teal-600" />
                <p className="text-teal-700 text-sm font-medium">
                  {solicitudes.length} solicitud{solicitudes.length !== 1 ? 'es' : ''} listas para procesar
                </p>
              </div>
            )}
            <ApplicationTable solicitudes={solicitudes} loading={loading} />
          </>
        )}
      </div>
    </Layout>
  );
}
