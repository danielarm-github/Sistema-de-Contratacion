import { useState } from 'react';
import { Settings, FileCheck, CheckCircle, Loader, Pencil } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Solicitud } from '../types';
import ConfirmModal from '../components/ConfirmModal';
import { generateContractHTML } from '../lib/contractGenerator';
import { useUpdateSolicitud, useCreateHistorial } from '../hooks/queries';

interface Props {
  solicitud: Solicitud;
  onDone: () => void;
}

interface EditableData {
  nombres_apellidos: string;
  ci: string;
  direccion: string;
  categoria_docente: string;
  grado_cientifico: string;
  asignaturas: string;
  departamento: string;
  centro_trabajo: string;
  fecha_inicio: string;
  fecha_fin: string;
  cargo: string;
  salario_mensual: string;
  facultad_filial: string;
  cargo_rh_firmante: string;
  nombre_rh: string;
}

function FieldEdit({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-slate-500 text-xs mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />
    </div>
  );
}

export default function RHContractPanel({ solicitud, onDone }: Props) {
  const { user, profile } = useAuth();
  const updateSolicitud = useUpdateSolicitud();
  const createHistorial = useCreateHistorial();
  const s = solicitud;

  const [data, setData] = useState<EditableData>({
    nombres_apellidos: s.nombres_apellidos,
    ci: s.ci,
    direccion: s.direccion,
    categoria_docente: s.categoria_docente,
    grado_cientifico: s.grado_cientifico,
    asignaturas: s.asignaturas,
    departamento: s.departamento,
    centro_trabajo: s.centro_trabajo,
    fecha_inicio: s.fecha_inicio ?? '',
    fecha_fin: s.fecha_fin ?? '',
    cargo: s.cargo,
    salario_mensual: s.salario_mensual?.toString() ?? '',
    facultad_filial: s.facultad_filial,
    cargo_rh_firmante: s.cargo_rh_firmante,
    nombre_rh: s.nombre_rh,
  });

  const [generating, setGenerating] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [error, setError] = useState('');

  const upd = (k: keyof EditableData, v: string) => {
    setData(p => ({ ...p, [k]: v }));
  };

  const saveRHData = async (extra: Partial<Solicitud> = {}) => {
    try {
      await updateSolicitud.mutateAsync({
        id: s.id,
        data: {
          salario_mensual: data.salario_mensual ? Number(data.salario_mensual) : null,
          facultad_filial: data.facultad_filial,
          cargo_rh_firmante: data.cargo_rh_firmante,
          nombre_rh: data.nombre_rh,
          nombres_apellidos: data.nombres_apellidos,
          ci: data.ci,
          direccion: data.direccion,
          categoria_docente: data.categoria_docente,
          grado_cientifico: data.grado_cientifico,
          asignaturas: data.asignaturas,
          departamento: data.departamento,
          centro_trabajo: data.centro_trabajo,
          fecha_inicio: data.fecha_inicio || null,
          fecha_fin: data.fecha_fin || null,
          cargo: data.cargo,
          ...extra
        },
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar datos');
      return false;
    }
  };

  const generateContract = async () => {
    setGenerating(true);
    setError('');
    const saved = await saveRHData();
    if (!saved) {
      setGenerating(false);
      return;
    }

    const html = generateContractHTML({ ...s, ...data, salario_mensual: data.salario_mensual ? Number(data.salario_mensual) : null });
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');

    if (!user) { setGenerating(false); return; }
    if (s.estado === 'SIGNED') {
      await updateSolicitud.mutateAsync({
        id: s.id,
        data: { estado: 'GENERATED' }
      });
      await createHistorial.mutateAsync({
        solicitud_id: s.id,
        usuario_id: user.id,
        usuario_nombre: profile?.full_name ?? '',
        accion: 'GENERADO',
        descripcion: `Contrato generado por ${profile?.full_name ?? 'RH'}`,
      });
      onDone();
    }
    setGenerating(false);
  };

  const handleComplete = async () => {
    if (!user) return;
    try {
      await updateSolicitud.mutateAsync({
        id: s.id,
        data: { estado: 'COMPLETED' }
      });
      await createHistorial.mutateAsync({
        solicitud_id: s.id,
        usuario_id: user.id,
        usuario_nombre: profile?.full_name ?? '',
        accion: 'COMPLETADO',
        descripcion: `Proceso completado por ${profile?.full_name ?? 'RH'}`,
      });
      setShowCompleteModal(false);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al completar');
    }
  };

  const isLoading = generating || updateSolicitud.isPending || createHistorial.isPending;

  return (
    <div className="bg-white rounded-xl border-2 border-teal-200 overflow-hidden">
      <div className="px-5 py-4 bg-teal-50 border-b border-teal-200 flex items-center gap-3">
        <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center">
          <Settings size={18} className="text-teal-600" />
        </div>
        <div>
          <h3 className="text-slate-800 font-semibold text-sm">Panel de Recursos Humanos</h3>
          <p className="text-slate-500 text-xs mt-0.5">Revisa y edita los datos antes de generar el contrato</p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
        )}

        <div className="flex items-center gap-2 text-slate-600 text-sm bg-amber-50 px-4 py-3 rounded-xl border border-amber-200">
          <Pencil size={14} className="text-amber-600 shrink-0" />
          <span>Todos los campos son editables en caso de que el parsing haya fallado o necesite corrección.</span>
        </div>

        <div>
          <h4 className="text-slate-700 font-semibold text-sm mb-3">Datos del Profesor</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FieldEdit label="Nombres y apellidos" value={data.nombres_apellidos} onChange={v => upd('nombres_apellidos', v)} />
            <FieldEdit label="CI" value={data.ci} onChange={v => upd('ci', v)} />
            <FieldEdit label="Dirección" value={data.direccion} onChange={v => upd('direccion', v)} />
            <FieldEdit label="Categoría docente" value={data.categoria_docente} onChange={v => upd('categoria_docente', v)} />
            <FieldEdit label="Grado científico" value={data.grado_cientifico} onChange={v => upd('grado_cientifico', v)} />
            <FieldEdit label="Cargo" value={data.cargo} onChange={v => upd('cargo', v)} />
            <FieldEdit label="Asignaturas" value={data.asignaturas} onChange={v => upd('asignaturas', v)} />
            <FieldEdit label="Departamento" value={data.departamento} onChange={v => upd('departamento', v)} />
            <FieldEdit label="Centro de trabajo" value={data.centro_trabajo} onChange={v => upd('centro_trabajo', v)} />
            <FieldEdit label="Fecha inicio" value={data.fecha_inicio} onChange={v => upd('fecha_inicio', v)} />
            <FieldEdit label="Fecha fin" value={data.fecha_fin} onChange={v => upd('fecha_fin', v)} />
          </div>
        </div>

        <div>
          <h4 className="text-slate-700 font-semibold text-sm mb-3">Datos del Contrato</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 text-xs mb-1">Salario mensual (CUP) <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={data.salario_mensual}
                onChange={e => upd('salario_mensual', e.target.value)}
                placeholder="Ej. 5000"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <FieldEdit label="Facultad / Filial" value={data.facultad_filial} onChange={v => upd('facultad_filial', v)} />
            <FieldEdit label="Cargo del firmante (RH)" value={data.cargo_rh_firmante} onChange={v => upd('cargo_rh_firmante', v)} />
            <FieldEdit label="Nombre del firmante (RH)" value={data.nombre_rh} onChange={v => upd('nombre_rh', v)} />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex gap-3">
            <button
              onClick={generateContract}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {isLoading && generating ? <Loader size={15} className="animate-spin" /> : <FileCheck size={15} />}
              {s.estado === 'GENERATED' ? 'Regenerar contrato' : 'Generar contrato (PDF)'}
            </button>
          </div>
          {s.estado === 'GENERATED' && (
            <button
              onClick={() => setShowCompleteModal(true)}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {isLoading && !generating ? <Loader size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              Marcar como completado
            </button>
          )}
        </div>
      </div>

      {showCompleteModal && (
        <ConfirmModal
          title="Finalizar proceso"
          message="Esto marcará la solicitud como COMPLETADA. El contrato ha sido generado y entregado. Esta acción finaliza el proceso."
          confirmLabel="Sí, completar"
          onConfirm={handleComplete}
          onCancel={() => setShowCompleteModal(false)}
        />
      )}
    </div>
  );
}
