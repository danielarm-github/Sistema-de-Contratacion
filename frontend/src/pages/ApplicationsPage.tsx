import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import Layout from '../components/Layout';
import ApplicationTable from '../components/ApplicationTable';
import { useSolicitudes } from '../hooks/queries';

const ESTADOS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'SUBMITTED', label: 'Enviada' },
  { value: 'SIGNED', label: 'Firmada' },
  { value: 'GENERATED', label: 'Generada' },
  { value: 'COMPLETED', label: 'Completada' },
];

export default function ApplicationsPage() {
  const { data, isLoading: loading } = useSolicitudes();
  const solicitudes = data || [];

  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  const filtered = solicitudes.filter(s => {
    const matchEstado = !filterEstado || s.estado === filterEstado;
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      s.nombres_apellidos?.toLowerCase().includes(q) ||
      s.ci?.toLowerCase().includes(q) ||
      s.departamento?.toLowerCase().includes(q) ||
      s.id.includes(q);
    return matchEstado && matchSearch;
  });

  return (
    <Layout title="Solicitudes" subtitle="Gestión de solicitudes de contratación">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, CI, ID..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="relative">
            <Filter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={filterEstado}
              onChange={e => setFilterEstado(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none min-w-48"
            >
              {ESTADOS.map(e => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-slate-500 text-sm">
            {loading ? 'Cargando...' : `${filtered.length} solicitud${filtered.length !== 1 ? 'es' : ''} encontrada${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <ApplicationTable solicitudes={filtered} loading={loading} />
      </div>
    </Layout>
  );
}
