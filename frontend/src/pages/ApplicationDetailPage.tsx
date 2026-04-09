import { useState } from 'react';
import { ArrowLeft, FileText, Download, Eye, Clock } from 'lucide-react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import HistorialTimeline from '../components/HistorialTimeline';
import PDFViewer from '../components/PDFViewer';
import { api } from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '../contexts/RouterContext';
import { useAuth } from '../contexts/AuthContext';
import { Documento } from '../types';
import RectorSignPanel from './RectorSignPanel';
import RHContractPanel from './RHContractPanel';
import { useSolicitud, useDocumentos, useHistorial, queryKeys } from '../hooks/queries';

function formatDate(str: string | null) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

const DOC_LABEL: Record<string, string> = {
  anexo1: 'Anexo 1',
  aval: 'Carta de Aval',
  declaracion: 'Declaración Jurada',
  foto_ci: 'Foto CI',
  anexo1_firmado: 'Anexo 1 (Firmado)',
  aval_firmado: 'Aval (Firmado)',
  declaracion_firmada: 'Declaración (Firmada)',
  contrato_pdf: 'Contrato PDF',
};

interface DataRowProps { label: string; value: string | number | boolean | null | undefined }
function DataRow({ label, value }: DataRowProps) {
  const display = value === null || value === undefined || value === '' ? '—' : String(value);
  return (
    <div className="flex gap-4 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 text-sm w-44 shrink-0">{label}</span>
      <span className="text-slate-800 text-sm font-medium flex-1">{display}</span>
    </div>
  );
}

export default function ApplicationDetailPage() {
  const { path, navigate } = useRouter();
  const { profile } = useAuth();
  const id = path.split('/').pop() ?? '';
  const queryClient = useQueryClient();

  const [viewer, setViewer] = useState<{ url: string; name: string } | null>(null);
  const [tab, setTab] = useState<'info' | 'docs' | 'historial'>('info');

  const { data: requestResult, isLoading: loadingSol } = useSolicitud(id);
  const { data: docsResult, isLoading: loadingDocs } = useDocumentos(id);
  const { data: histResult, isLoading: loadingHist } = useHistorial(id);

  const solicitud = requestResult;
  const docs = docsResult || [];
  const historial = histResult || [];
  const loading = loadingSol || loadingDocs || loadingHist;

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.solicitud(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.documentos(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.historial(id) });
  };

  const getDocUrl = async (storagePath: string) => {
    return api.storage.getSignedUrl(storagePath);
  };

  const openDoc = async (doc: Documento) => {
    const url = await getDocUrl(doc.storage_path);
    if (url) setViewer({ url, name: doc.nombre || DOC_LABEL[doc.tipo] || doc.tipo });
  };

  const downloadDoc = async (doc: Documento) => {
    const url = await getDocUrl(doc.storage_path);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.nombre;
      a.click();
    }
  };

  if (loading) {
    return (
      <Layout title="Solicitud" subtitle="Cargando...">
        <div className="space-y-3 max-w-4xl">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      </Layout>
    );
  }

  if (!solicitud || !solicitud.id) {
    return (
      <Layout title="Solicitud no encontrada">
        <div className="text-center py-20">
          <p className="text-slate-500">Esta solicitud no existe o no tienes acceso.</p>
          <button onClick={() => navigate('/solicitudes')} className="mt-4 text-blue-600 hover:underline text-sm">Volver a solicitudes</button>
        </div>
      </Layout>
    );
  }

  const s = solicitud;

  return (
    <Layout title={s.nombres_apellidos || 'Solicitud'} subtitle={`Estado: ${s.estado} · ID: ${s.id.slice(0, 8)}`}>
      <div className="max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/solicitudes')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            Volver a solicitudes
          </button>
          <StatusBadge estado={s.estado} />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-200">
            {[
              { id: 'info', label: 'Información', icon: <FileText size={14} /> },
              { id: 'docs', label: 'Documentos', icon: <Download size={14} /> },
              { id: 'historial', label: 'Historial', icon: <Clock size={14} /> },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === t.id ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {tab === 'info' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-slate-800 font-semibold text-sm mb-3">Datos del Profesor</h3>
                  <DataRow label="Nombres y apellidos" value={s.nombres_apellidos} />
                  <DataRow label="CI" value={s.ci} />
                  <DataRow label="Dirección" value={s.direccion} />
                  <DataRow label="Jubilado" value={s.jubilado ? 'Sí' : 'No'} />
                  <DataRow label="Categoría docente" value={s.categoria_docente} />
                  <DataRow label="Grado científico" value={s.grado_cientifico} />
                  <DataRow label="Carrera de graduación" value={s.carrera_graduacion} />
                </div>
                <div>
                  <h3 className="text-slate-800 font-semibold text-sm mb-3">Información Académica</h3>
                  <DataRow label="Asignaturas" value={s.asignaturas} />
                  <DataRow label="Carreras" value={s.carreras} />
                  <DataRow label="Departamento" value={s.departamento} />
                  <DataRow label="Facultad" value={s.facultad} />
                  <DataRow label="Tipo de perfil" value={s.tipo_perfil} />
                  <DataRow label="Disp. de plazas" value={s.disponibilidad_plazas} />
                </div>
                <div>
                  <h3 className="text-slate-800 font-semibold text-sm mb-3">Centro de Trabajo</h3>
                  <DataRow label="Centro de trabajo" value={s.centro_trabajo} />
                  <DataRow label="Organismo" value={s.organismo} />
                  <DataRow label="Cargo" value={s.cargo} />
                </div>
                <div>
                  <h3 className="text-slate-800 font-semibold text-sm mb-3">Contrato</h3>
                  <DataRow label="Fecha de inicio" value={formatDate(s.fecha_inicio)} />
                  <DataRow label="Fecha de fin" value={formatDate(s.fecha_fin)} />
                </div>
                <div>
                  <h3 className="text-slate-800 font-semibold text-sm mb-3">Actividades (h/semana)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                    {[
                      ['Pregrado presencial', s.docencia_pregrado_presencial],
                      ['Semipresencial', s.docencia_semipresencial],
                      ['Postgrado', s.docencia_postgrado],
                      ['Práctica laboral', s.practica_laboral],
                      ['Investigativo', s.trabajo_investigativo],
                      ['Tutoría', s.tutoria],
                      ['Consultas', s.consultas],
                      ['Prep. metodológica', s.preparacion_metodologica],
                      ['Trabajo científico', s.trabajo_cientifico],
                    ].map(([label, val]) => (
                      <div key={label as string} className="bg-slate-50 rounded-lg px-3 py-2">
                        <p className="text-slate-500 text-xs">{label}</p>
                        <p className="text-slate-800 font-semibold text-sm mt-0.5">{val ?? 0} h</p>
                      </div>
                    ))}
                  </div>
                </div>
                {s.fundamentacion && (
                  <div>
                    <h3 className="text-slate-800 font-semibold text-sm mb-3">Fundamentación</h3>
                    <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl">{s.fundamentacion}</p>
                  </div>
                )}
              </div>
            )}

            {tab === 'docs' && (
              <div className="space-y-3">
                {docs.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">No hay documentos cargados</p>
                ) : (
                  docs.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                          <FileText size={16} className="text-slate-500" />
                        </div>
                        <div>
                          <p className="text-slate-800 text-sm font-medium">{DOC_LABEL[doc.tipo] ?? doc.tipo}</p>
                          <p className="text-slate-400 text-xs mt-0.5">{doc.nombre}</p>
                          {doc.es_firmado && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">Firmado</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDoc(doc)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Eye size={12} />
                          Ver
                        </button>
                        <button
                          onClick={() => downloadDoc(doc)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Download size={12} />
                          Descargar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'historial' && <HistorialTimeline historial={historial} />}
          </div>
        </div>

        {profile?.role === 'RECTOR' && s.estado === 'SUBMITTED' && (
          <RectorSignPanel solicitud={s} docs={docs} onDone={refreshAll} />
        )}

        {profile?.role === 'RH' && (s.estado === 'SIGNED' || s.estado === 'GENERATED') && (
          <RHContractPanel solicitud={s} onDone={refreshAll} />
        )}
      </div>

      {viewer && <PDFViewer url={viewer.url} name={viewer.name} onClose={() => setViewer(null)} />}
    </Layout>
  );
}
