import { X, Download, FileText, ExternalLink } from 'lucide-react';

interface Props {
  url: string;
  name: string;
  onClose: () => void;
}

export default function PDFViewer({ url, name, onClose }: Props) {
  const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(name) || url.includes('foto_ci');

  console.log(url)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 flex flex-col overflow-hidden" style={{ height: '85vh' }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={16} className="text-slate-500 shrink-0" />
            <span className="text-slate-700 font-medium text-sm truncate">{name}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={url}
              download={name}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={13} />
              Descargar
            </a>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <ExternalLink size={13} />
              Abrir
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden bg-slate-200">
          {isImage ? (
            <div className="flex items-center justify-center h-full p-6">
              <img src={url} alt={name} className="max-h-full max-w-full object-contain rounded-lg shadow" />
            </div>
          ) : (
            <iframe
              src={`${url}#toolbar=1&navpanes=0`}
              className="w-full h-full border-0"
              title={name}
            />
          )}
        </div>
      </div>
    </div>
  );
}
