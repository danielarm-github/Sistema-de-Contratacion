import { LayoutDashboard, FileText, User, PlusCircle, Pen, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../contexts/RouterContext';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  roles?: string[];
}

const NAV: NavItem[] = [
  { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/' },
  { icon: <FileText size={18} />, label: 'Solicitudes', path: '/solicitudes' },
  { icon: <PlusCircle size={18} />, label: 'Nueva Solicitud', path: '/solicitudes/nueva', roles: ['JEFE'] },
  { icon: <Pen size={18} />, label: 'Por Firmar', path: '/rector/firmar', roles: ['RECTOR'] },
  { icon: <Settings size={18} />, label: 'Generar Contratos', path: '/rh/contratos', roles: ['RH'] },
  { icon: <User size={18} />, label: 'Perfil', path: '/perfil' },
];

export default function Sidebar() {
  const { profile } = useAuth();
  const { path, navigate } = useRouter();

  const visible = NAV.filter(item => !item.roles || item.roles.includes(profile?.role ?? ''));

  return (
    <aside className="w-60 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-20">
      <div className="px-6 py-5 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <FileText size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">SisDoc</p>
            <p className="text-slate-400 text-xs">Contratos Docentes</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {visible.map(item => {
          const active = path === item.path || (item.path !== '/' && path.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </nav>

      {profile && (
        <div className="px-4 py-4 border-t border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold uppercase">
              {profile.full_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{profile.full_name}</p>
              <p className="text-slate-400 text-xs">
                {profile.role === 'JEFE' ? 'Jefe de Área' : profile.role === 'RECTOR' ? 'Rector' : 'Recursos Humanos'}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
