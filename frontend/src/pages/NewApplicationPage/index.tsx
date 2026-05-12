import { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp, Save, Send, CheckCircle, Loader } from 'lucide-react';
import Layout from '../../components/Layout';
import DocumentUploader from '../../components/DocumentUploader';
import ConfirmModal from '../../components/ConfirmModal';
import { FormField, TextInput, Textarea, NumberInput } from './FormField';
import { FormData, INITIAL_FORM } from './types';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from '../../contexts/RouterContext';
import { DocTipo, Documento, Solicitud, Estado } from '../../types';
import { useCreateSolicitud, useUpdateSolicitud, useCreateHistorial, useSolicitud, useDocumentos } from '../../hooks/queries';

interface Section {
  id: string;
  title: string;
  icon: string;
  content: (form: FormData, update: (k: keyof FormData, v: unknown) => void) => React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    id: 's1',
    title: 'Datos del Profesor (Anexo 1)',
    icon: '🧾',
    content: (form, upd) => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <FormField label="Nombres y apellidos" required>
            <TextInput value={form.nombres_apellidos} onChange={v => upd('nombres_apellidos', v)} placeholder="Ej. Juan Carlos Pérez Rodríguez" required />
          </FormField>
        </div>
        <FormField label="CI (Carnet de Identidad)" required>
          <TextInput value={form.ci} onChange={v => upd('ci', v)} placeholder="Ej. 85042312345" required />
        </FormField>
        <FormField label="Dirección particular">
          <Textarea value={form.direccion} onChange={v => upd('direccion', v)} placeholder="Calle, número, municipio, provincia" rows={2} />
        </FormField>
        <FormField label="Categoría docente">
          <TextInput value={form.categoria_docente} onChange={v => upd('categoria_docente', v)} placeholder="Ej. Instructor, Asistente, Auxiliar" />
        </FormField>
        <FormField label="Grado científico">
          <TextInput value={form.grado_cientifico} onChange={v => upd('grado_cientifico', v)} placeholder="Ej. Dr.C., M.Sc., Lic." />
        </FormField>
        <FormField label="Carrera de graduación">
          <TextInput value={form.carrera_graduacion} onChange={v => upd('carrera_graduacion', v)} placeholder="Ej. Ingeniería Informática" />
        </FormField>
        <div className="flex items-center gap-3 mt-1">
          <input
            type="checkbox"
            id="jubilado"
            checked={form.jubilado}
            onChange={e => upd('jubilado', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="jubilado" className="text-sm text-slate-700 font-medium cursor-pointer">Jubilado</label>
        </div>
      </div>
    ),
  },
  {
    id: 's2',
    title: 'Información Académica',
    icon: '📘',
    content: (form, upd) => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <FormField label="Asignaturas que impartirá" required>
            <Textarea value={form.asignaturas} onChange={v => upd('asignaturas', v)} placeholder="Lista las asignaturas separadas por coma o línea" rows={3} required />
          </FormField>
        </div>
        <div className="md:col-span-2">
          <FormField label="Carreras">
            <Textarea value={form.carreras} onChange={v => upd('carreras', v)} placeholder="Carreras en las que impartirá clases" rows={2} />
          </FormField>
        </div>
        <FormField label="Departamento" required>
          <TextInput value={form.departamento} onChange={v => upd('departamento', v)} placeholder="Ej. Departamento de Informática" required />
        </FormField>
        <FormField label="Facultad">
          <TextInput value={form.facultad} onChange={v => upd('facultad', v)} placeholder="Ej. Facultad de Ciencias Técnicas" />
        </FormField>
        <FormField label="Disponibilidad de plazas">
          <NumberInput value={form.disponibilidad_plazas} onChange={v => upd('disponibilidad_plazas', v)} min={0} placeholder="Número de plazas" />
        </FormField>
        <FormField label="Tipo de perfil">
          <TextInput value={form.tipo_perfil} onChange={v => upd('tipo_perfil', v)} placeholder="Ej. Técnico, Investigador, Docente" />
        </FormField>
      </div>
    ),
  },
  {
    id: 's3',
    title: 'Centro de Trabajo',
    icon: '🏢',
    content: (form, upd) => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Centro de trabajo">
          <TextInput value={form.centro_trabajo} onChange={v => upd('centro_trabajo', v)} placeholder="Nombre del centro donde trabaja" />
        </FormField>
        <FormField label="Organismo">
          <TextInput value={form.organismo} onChange={v => upd('organismo', v)} placeholder="Organismo al que pertenece" />
        </FormField>
        <div className="md:col-span-2">
          <FormField label="Cargo que ocupa">
            <TextInput value={form.cargo} onChange={v => upd('cargo', v)} placeholder="Cargo actual en el centro de trabajo" />
          </FormField>
        </div>
      </div>
    ),
  },
  {
    id: 's4',
    title: 'Período del Contrato',
    icon: '📅',
    content: (form, upd) => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Fecha de inicio" required>
          <TextInput type="date" value={form.fecha_inicio} onChange={v => upd('fecha_inicio', v)} required />
        </FormField>
        <FormField label="Fecha de fin" required>
          <TextInput type="date" value={form.fecha_fin} onChange={v => upd('fecha_fin', v)} required />
        </FormField>
      </div>
    ),
  },
  {
    id: 's5',
    title: 'Actividades Docentes (horas/semana)',
    icon: '🧠',
    content: (form, upd) => (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { key: 'docencia_pregrado_presencial', label: 'Docencia pregrado presencial' },
          { key: 'docencia_semipresencial', label: 'Docencia semipresencial' },
          { key: 'docencia_postgrado', label: 'Docencia postgrado' },
          { key: 'practica_laboral', label: 'Práctica laboral' },
          { key: 'trabajo_investigativo', label: 'Trabajo investigativo' },
          { key: 'tutoria', label: 'Tutoría' },
          { key: 'consultas', label: 'Consultas' },
          { key: 'preparacion_metodologica', label: 'Prep. metodológica' },
          { key: 'trabajo_cientifico', label: 'Trabajo científico' },
        ].map(item => (
          <FormField key={item.key} label={item.label}>
            <NumberInput
              value={form[item.key as keyof FormData] as number}
              onChange={v => upd(item.key as keyof FormData, v)}
              min={0}
              placeholder="0"
            />
          </FormField>
        ))}
      </div>
    ),
  },
  {
    id: 's6',
    title: 'Fundamentación',
    icon: '📝',
    content: (form, upd) => (
      <FormField label="Fundamentación de la solicitud">
        <Textarea
          value={form.fundamentacion}
          onChange={v => upd('fundamentacion', v)}
          placeholder="Explique la necesidad de contratación, justificación académica, etc."
          rows={6}
        />
      </FormField>
    ),
  },
];

const REQUIRED_DOCS: DocTipo[] = ['anexo1', 'aval', 'declaracion', 'foto_ci'];

const DOC_CONFIGS = [
  { tipo: 'anexo1' as DocTipo, label: 'Anexo 1', accept: '.pdf', required: true, hint: 'Documento PDF' },
  { tipo: 'aval' as DocTipo, label: 'Carta de Aval', accept: '.pdf', required: true, hint: 'Documento PDF' },
  { tipo: 'declaracion' as DocTipo, label: 'Declaración Jurada', accept: '.pdf', required: true, hint: 'Documento PDF' },
  { tipo: 'foto_ci' as DocTipo, label: 'Foto del Carnet de Identidad', accept: 'image/*,.pdf', required: true, hint: 'Imagen o PDF' },
];

export default function NewApplicationPage() {
  const { user, profile } = useAuth();
  const { navigate, params } = useRouter();
  const createSolicitud = useCreateSolicitud();
  const updateSolicitud = useUpdateSolicitud();
  const createHistorial = useCreateHistorial();

  const editId = params.id;
  const { data: existingSolicitud, isLoading: loadingSolicitud } = useSolicitud(editId);
  const { data: existingDocs } = useDocumentos(editId);

  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [openSection, setOpenSection] = useState<string>('s1');
  const [solicitudId, setSolicitudId] = useState<string | null>(null);
  const [docs, setDocs] = useState<Record<DocTipo, Documento | undefined>>({} as Record<DocTipo, Documento | undefined>);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // Sync state if editing
  useEffect(() => {
    if (editId) setSolicitudId(editId);
  }, [editId]);

  useEffect(() => {
    if (existingSolicitud) {
      const formatDateForInput = (dateStr: string | null) => {
        if (!dateStr) return '';
        return dateStr.split('T')[0];
      };

      setForm({
        nombres_apellidos: existingSolicitud.nombres_apellidos || '',
        ci: existingSolicitud.ci || '',
        direccion: existingSolicitud.direccion || '',
        jubilado: existingSolicitud.jubilado || false,
        categoria_docente: existingSolicitud.categoria_docente || '',
        grado_cientifico: existingSolicitud.grado_cientifico || '',
        carrera_graduacion: existingSolicitud.carrera_graduacion || '',
        asignaturas: existingSolicitud.asignaturas || '',
        carreras: existingSolicitud.carreras || '',
        departamento: existingSolicitud.departamento || '',
        facultad: existingSolicitud.facultad || '',
        disponibilidad_plazas: existingSolicitud.disponibilidad_plazas || 0,
        tipo_perfil: existingSolicitud.tipo_perfil || '',
        centro_trabajo: existingSolicitud.centro_trabajo || '',
        organismo: existingSolicitud.organismo || '',
        cargo: existingSolicitud.cargo || '',
        fecha_inicio: formatDateForInput(existingSolicitud.fecha_inicio),
        fecha_fin: formatDateForInput(existingSolicitud.fecha_fin),
        docencia_pregrado_presencial: existingSolicitud.docencia_pregrado_presencial || 0,
        docencia_semipresencial: existingSolicitud.docencia_semipresencial || 0,
        docencia_postgrado: existingSolicitud.docencia_postgrado || 0,
        practica_laboral: existingSolicitud.practica_laboral || 0,
        trabajo_investigativo: existingSolicitud.trabajo_investigativo || 0,
        tutoria: existingSolicitud.tutoria || 0,
        consultas: existingSolicitud.consultas || 0,
        preparacion_metodologica: existingSolicitud.preparacion_metodologica || 0,
        trabajo_cientifico: existingSolicitud.trabajo_cientifico || 0,
        fundamentacion: existingSolicitud.fundamentacion || '',
      });
    }
  }, [existingSolicitud]);

  useEffect(() => {
    if (existingDocs) {
      const docsMap: Record<DocTipo, Documento | undefined> = {} as any;
      existingDocs.forEach(d => {
        docsMap[d.tipo as DocTipo] = d;
      });
      setDocs(docsMap);
    }
  }, [existingDocs]);

  const update = useCallback((k: keyof FormData, v: unknown) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setSaved(false);
  }, []);

  const buildPayload = (estado: Estado) => ({
    ...(form as unknown as Record<string, unknown>),
    estado,
    created_by: user!.id,
    fecha_inicio: form.fecha_inicio || null,
    fecha_fin: form.fecha_fin || null,
  });

  const saveDraft = async () => {
    if (!user) return;
    setError('');
    try {
      if (solicitudId) {
        await updateSolicitud.mutateAsync({
          id: solicitudId,
          data: form as Partial<Solicitud>
        });
      } else {
        const data = await createSolicitud.mutateAsync(buildPayload('DRAFT'));
        if (data) {
          setSolicitudId(data.id);
          await createHistorial.mutateAsync({
            solicitud_id: data.id,
            usuario_id: user.id,
            usuario_nombre: profile?.full_name ?? '',
            accion: 'CREADO',
            descripcion: `Borrador creado por ${profile?.full_name ?? 'usuario'}`,
          });
        }
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleSubmit = async () => {
    if (!user || !solicitudId) return;
    const missingDocs = REQUIRED_DOCS.filter(d => !docs[d]);
    if (missingDocs.length) {
      setError('Debes subir todos los documentos requeridos antes de enviar.');
      setShowSubmitModal(false);
      return;
    }
    setError('');
    try {
      await updateSolicitud.mutateAsync({
        id: solicitudId,
        data: { estado: 'SUBMITTED' }
      });
      await createHistorial.mutateAsync({
        solicitud_id: solicitudId,
        usuario_id: user.id,
        usuario_nombre: profile?.full_name ?? '',
        accion: 'ENVIADO',
        descripcion: `Solicitud enviada para firma por ${profile?.full_name ?? 'usuario'}`,
      });
      navigate(`/solicitudes/${solicitudId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar');
    }
  };

  const isSaving = createSolicitud.isPending || updateSolicitud.isPending;
  const isSubmitting = updateSolicitud.isPending || createHistorial.isPending;
  const canSubmit = solicitudId && REQUIRED_DOCS.every(d => docs[d]);

  if (editId && loadingSolicitud) {
    return (
      <Layout title="Cargando..." subtitle="Recuperando datos de la solicitud">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader size={32} className="animate-spin text-blue-600" />
          <p className="text-slate-500 font-medium">Cargando borrador...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title={editId ? "Editar Solicitud" : "Nueva Solicitud"} 
      subtitle={editId ? "Modifique los datos guardados en el borrador" : "Complete los datos del profesor adjunto"}
    >
      <div className="max-w-3xl mx-auto space-y-3">
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {SECTIONS.map(section => (
          <div key={section.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setOpenSection(open => open === section.id ? '' : section.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{section.icon}</span>
                <span className="text-slate-800 font-semibold text-sm">{section.title}</span>
              </div>
              {openSection === section.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>
            {openSection === section.id && (
              <div className="px-5 pb-5 border-t border-slate-100">
                <div className="pt-4">
                  {section.content(form, update)}
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setOpenSection(open => open === 's7' ? '' : 's7')}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📎</span>
              <span className="text-slate-800 font-semibold text-sm">Documentos Requeridos</span>
              {REQUIRED_DOCS.every(d => docs[d]) && (
                <CheckCircle size={15} className="text-green-500" />
              )}
            </div>
            {openSection === 's7' ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </button>
          {openSection === 's7' && (
            <div className="px-5 pb-5 border-t border-slate-100 pt-4">
              {!solicitudId ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm">Primero guarda el borrador para poder subir documentos.</p>
                  <button
                    onClick={saveDraft}
                    disabled={isSaving}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar borrador primero'}
                  </button>
                </div>
              ) : (
                <DocumentUploader
                  solicitudId={solicitudId}
                  docs={DOC_CONFIGS}
                  existing={docs}
                  onUploaded={doc => setDocs(prev => ({ ...prev, [doc.tipo]: doc }))}
                />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 pb-6">
          <button
            onClick={() => navigate('/solicitudes')}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white border border-slate-200 rounded-xl transition-colors shadow-sm"
          >
            {editId ? "Cerrar" : "Cancelar"}
          </button>
          <div className="flex gap-3">
            <button
              onClick={saveDraft}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isSaving ? <Loader size={15} className="animate-spin" /> : <Save size={15} />}
              {isSaving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
            </button>
            <button
              onClick={() => { if (!canSubmit) { setError('Completa todos los campos y sube los documentos requeridos.'); return; } setShowSubmitModal(true); }}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-blue-600/20"
            >
              {isSubmitting ? <Loader size={15} className="animate-spin" /> : <Send size={15} />}
              {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </div>
        </div>
      </div>

      {showSubmitModal && (
        <ConfirmModal
          title="Enviar solicitud"
          message="Al enviar, la solicitud pasará al Rector para su firma. Asegúrate de que toda la información es correcta."
          confirmLabel="Sí, enviar"
          onConfirm={handleSubmit}
          onCancel={() => setShowSubmitModal(false)}
        />
      )}
    </Layout>
  );
}
