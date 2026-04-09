import { Historial } from '../types';
import { Clock, CheckCircle, Send, PenLine, FileCheck, Trophy } from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  CREADO: <Clock size={14} />,
  ENVIADO: <Send size={14} />,
  FIRMADO: <PenLine size={14} />,
  GENERADO: <FileCheck size={14} />,
  COMPLETADO: <Trophy size={14} />,
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface Props {
  historial: Historial[];
}

export default function HistorialTimeline({ historial }: Props) {
  if (!historial.length) {
    return <p className="text-slate-400 text-sm text-center py-6">Sin historial aún</p>;
  }

  return (
    <div className="space-y-0">
      {historial.map((item, idx) => (
        <div key={item.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              {ICON_MAP[item.accion] ?? <CheckCircle size={14} />}
            </div>
            {idx < historial.length - 1 && (
              <div className="w-px flex-1 bg-slate-200 my-1.5" />
            )}
          </div>
          <div className="pb-5">
            <p className="text-slate-800 text-sm font-medium leading-tight">{item.descripcion}</p>
            <p className="text-slate-400 text-xs mt-1">
              {item.usuario_nombre} &middot; {formatDate(item.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
