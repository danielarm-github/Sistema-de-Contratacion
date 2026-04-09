import { Estado } from '../types';

const CONFIG: Record<Estado, { label: string; className: string }> = {
  DRAFT: { label: 'Borrador', className: 'bg-gray-100 text-gray-600 border border-gray-200' },
  SUBMITTED: { label: 'Enviada', className: 'bg-blue-100 text-blue-700 border border-blue-200' },
  SIGNED: { label: 'Firmada', className: 'bg-amber-100 text-amber-700 border border-amber-200' },
  GENERATED: { label: 'Generada', className: 'bg-teal-100 text-teal-700 border border-teal-200' },
  COMPLETED: { label: 'Completada', className: 'bg-green-100 text-green-700 border border-green-200' },
};

interface Props {
  estado: Estado;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ estado, size = 'md' }: Props) {
  const { label, className } = CONFIG[estado] ?? CONFIG.DRAFT;
  const textSize = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${textSize} ${className}`}>
      {label}
    </span>
  );
}
