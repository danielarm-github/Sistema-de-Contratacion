import { useState } from 'react';
import { User, Mail, Shield } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useUpdateProfile } from '../hooks/queries';

const ROLE_LABELS: Record<string, string> = {
  JEFE: 'Jefe de Área',
  RECTOR: 'Rector',
  RH: 'Recursos Humanos',
};

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!user || !name.trim()) return;
    setError('');
    setSuccess('');
    try {
      await updateProfile.mutateAsync({
        id: user.id,
        data: { full_name: name.trim() }
      });
      setSuccess('Perfil actualizado correctamente');
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar perfil');
    }
  };

  const saving = updateProfile.isPending;

  return (
    <Layout title="Mi Perfil" subtitle="Información de tu cuenta">
      <div className="max-w-lg space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="text-slate-800 font-semibold text-lg">{profile?.full_name}</p>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium mt-1">
                <Shield size={11} />
                {ROLE_LABELS[profile?.role ?? ''] ?? profile?.role}
              </span>
            </div>
          </div>

          {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
          {success && <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">{success}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-1.5">
                <span className="flex items-center gap-2"><User size={14} /> Nombre completo</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-1.5">
                <span className="flex items-center gap-2"><Mail size={14} /> Correo electrónico</span>
              </label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-1.5">
                <span className="flex items-center gap-2"><Shield size={14} /> Rol en el sistema</span>
              </label>
              <input
                type="text"
                value={ROLE_LABELS[profile?.role ?? ''] ?? profile?.role ?? ''}
                disabled
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
