import { LogOut, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: Props) {
  const { signOut } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div>
        <h1 className="text-slate-800 font-semibold text-lg leading-tight">{title}</h1>
        {subtitle && <p className="text-slate-500 text-xs">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <Bell size={18} />
        </button>
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors font-medium"
        >
          <LogOut size={16} />
          Salir
        </button>
      </div>
    </header>
  );
}
