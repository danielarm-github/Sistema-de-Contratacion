import { useState } from 'react';
import { PenLine, CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Solicitud, Documento, DocTipo } from '../types';
import ConfirmModal from '../components/ConfirmModal';
import DocumentUploader from '../components/DocumentUploader';
import { useUpdateSolicitud, useCreateHistorial } from '../hooks/queries';

interface Props {
  solicitud: Solicitud;
  docs: Documento[];
  onDone: () => void;
}

const SIGN_DOCS = [
  { tipo: 'anexo1_firmado' as DocTipo, label: 'Anexo 1 (Firmado por Rector)', accept: '.pdf', required: true },
  { tipo: 'aval_firmado' as DocTipo, label: 'Carta de Aval (Firmada)', accept: '.pdf', required: true },
  { tipo: 'declaracion_firmada' as DocTipo, label: 'Declaración Jurada (Firmada)', accept: '.pdf', required: true },
];

export default function RectorSignPanel({ solicitud, docs, onDone }: Props) {
  const { user, profile } = useAuth();
  const updateSolicitud = useUpdateSolicitud();
  const createHistorial = useCreateHistorial();
  
  const [signedDocs, setSignedDocs] = useState<Record<DocTipo, Documento | undefined>>(
    () => {
      const map = {} as Record<DocTipo, Documento | undefined>;
      docs.forEach(d => { map[d.tipo] = d; });
      return map;
    }
  );
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const allUploaded = SIGN_DOCS.every(d => signedDocs[d.tipo]);

  const handleConfirm = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    
    try {
      await updateSolicitud.mutateAsync({ 
        id: solicitud.id, 
        data: { estado: 'SIGNED', updated_at: new Date().toISOString() } 
      });
      
      await createHistorial.mutateAsync({
        solicitud_id: solicitud.id,
        usuario_id: user.id,
        usuario_nombre: profile?.full_name ?? '',
        accion: 'FIRMADO',
        descripcion: `Documentos firmados y confirmados por ${profile?.full_name ?? 'Rector'}`,
      });
      
      setLoading(false);
      setShowModal(false);
      onDone();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error');
      }
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-amber-200 overflow-hidden">
      <div className="px-5 py-4 bg-amber-50 border-b border-amber-200 flex items-center gap-3">
        <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
          <PenLine size={18} className="text-amber-600" />
        </div>
        <div>
          <h3 className="text-slate-800 font-semibold text-sm">Panel de Firma — Rector</h3>
          <p className="text-slate-500 text-xs mt-0.5">Sube los documentos firmados y confirma la firma</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
        )}

        <p className="text-slate-600 text-sm">
          Descarga los documentos originales desde la pestaña <strong>Documentos</strong>, fírmalos y súbelos aquí.
        </p>

        <DocumentUploader
          solicitudId={solicitud.id}
          docs={SIGN_DOCS}
          existing={signedDocs}
          onUploaded={doc => setSignedDocs(prev => ({ ...prev, [doc.tipo]: doc }))}
        />

        <div className="flex justify-end pt-2">
          <button
            onClick={() => setShowModal(true)}
            disabled={!allUploaded || loading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader size={15} className="animate-spin" /> : <CheckCircle size={15} />}
            Confirmar firma
          </button>
        </div>

        {!allUploaded && (
          <p className="text-amber-600 text-xs text-right">Sube los 3 documentos firmados para continuar</p>
        )}
      </div>

      {showModal && (
        <ConfirmModal
          title="Confirmar firma"
          message="Al confirmar, la solicitud pasará al área de Recursos Humanos para la generación del contrato. Esta acción no se puede revertir."
          confirmLabel="Sí, confirmar firma"
          onConfirm={handleConfirm}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
