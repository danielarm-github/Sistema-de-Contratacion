import { PenLine } from 'lucide-react';
import Layout from '../components/Layout';
import ApplicationTable from '../components/ApplicationTable';
import { useSolicitudes } from '../hooks/queries';

export default function RectorPage() {
  const { data, isLoading: loading } = useSolicitudes({ eq: { col: 'estado', val: 'SUBMITTED' } });
  const solicitudes = data || [];

  return (
    <Layout title="Solicitudes por Firmar" subtitle="Revisión y firma de documentos — Rector">
      <div className="space-y-4">
        {!loading && solicitudes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <PenLine size={24} className="text-amber-500" />
            </div>
            <p className="text-slate-700 font-medium">No hay solicitudes pendientes de firma</p>
            <p className="text-slate-400 text-sm mt-1">Las solicitudes enviadas por los jefes de área aparecerán aquí</p>
          </div>
        ) : (
          <>
            {!loading && (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                <PenLine size={15} className="text-amber-600" />
                <p className="text-amber-700 text-sm font-medium">
                  {solicitudes.length} solicitud{solicitudes.length !== 1 ? 'es' : ''} esperando firma
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
