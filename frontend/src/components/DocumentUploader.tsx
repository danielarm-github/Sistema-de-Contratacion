import { useRef, useState } from 'react';
import { Upload, CheckCircle, Loader } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { DocTipo, Documento } from '../types';

interface DocConfig {
  tipo: DocTipo;
  label: string;
  accept: string;
  required?: boolean;
  hint?: string;
}

interface Props {
  solicitudId: string;
  docs: DocConfig[];
  existing: Record<DocTipo, Documento | undefined>;
  onUploaded: (doc: Documento) => void;
}

export default function DocumentUploader({ solicitudId, docs, existing, onUploaded }: Props) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const refs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleUpload = async (tipo: DocTipo, file: File) => {
    if (!user) return;
    setUploading(p => ({ ...p, [tipo]: true }));
    setErrors(p => ({ ...p, [tipo]: '' }));

    const ext = file.name.split('.').pop();
    const path = `${solicitudId}/${tipo}_${Date.now()}.${ext}`;

    try {
      // 1. Upload file
      await api.documentos.upload(path, file);

      // 2. Delete existing record if any
      if (existing[tipo]) {
        await api.documentos.delete(existing[tipo]!.id);
      }

      // 3. Create document record
      const newDoc = await api.documentos.create({
        solicitud_id: solicitudId,
        tipo,
        storage_path: path,
        nombre: file.name,
        es_firmado: tipo.includes('firmado'),
        uploaded_by: user.id
      });

      onUploaded(newDoc);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrors(p => ({ ...p, [tipo]: err.message }));
      } else {
        setErrors(p => ({ ...p, [tipo]: 'Error de subida' }));
      }
    } finally {
      setUploading(p => ({ ...p, [tipo]: false }));
    }
  };

  return (
    <div className="space-y-3">
      {docs.map(doc => {
        const has = !!existing[doc.tipo];
        const isLoading = uploading[doc.tipo];
        const err = errors[doc.tipo];
        return (
          <div key={doc.tipo} className={`rounded-xl border-2 transition-colors ${has ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${has ? 'bg-green-100' : 'bg-slate-100'}`}>
                  {isLoading ? (
                    <Loader size={16} className="text-slate-500 animate-spin" />
                  ) : has ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <Upload size={16} className="text-slate-500" />
                  )}
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-medium">
                    {doc.label}
                    {doc.required && <span className="text-red-500 ml-1">*</span>}
                  </p>
                  {has && existing[doc.tipo] && (
                    <p className="text-green-600 text-xs mt-0.5 truncate max-w-xs">{existing[doc.tipo]!.nombre}</p>
                  )}
                  {!has && doc.hint && (
                    <p className="text-slate-400 text-xs mt-0.5">{doc.hint}</p>
                  )}
                  {err && <p className="text-red-500 text-xs mt-0.5">{err}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {has && (
                  <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full">Subido</span>
                )}
                <button
                  type="button"
                  onClick={() => refs.current[doc.tipo]?.click()}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {has ? 'Reemplazar' : 'Subir'}
                </button>
              </div>
            </div>
            <input
              ref={el => { refs.current[doc.tipo] = el; }}
              type="file"
              accept={doc.accept}
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleUpload(doc.tipo, f);
                e.target.value = '';
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
