import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RouterProvider, useRouter } from './contexts/RouterContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import NewApplicationPage from './pages/NewApplicationPage/index';
import RectorPage from './pages/RectorPage';
import RHPage from './pages/RHPage';
import ProfilePage from './pages/ProfilePage';

function AppRoutes() {
  const { user, loading } = useAuth();
  const { path } = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  if (path === '/' || path === '') return <DashboardPage />;
  if (path === '/solicitudes') return <ApplicationsPage />;
  if (path === '/solicitudes/nueva') return <NewApplicationPage />;
  if (path.startsWith('/solicitudes/') && path.split('/').length === 3) return <ApplicationDetailPage />;
  if (path === '/rector/firmar') return <RectorPage />;
  if (path === '/rh/contratos') return <RHPage />;
  if (path === '/perfil') return <ProfilePage />;

  return <DashboardPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppRoutes />
      </RouterProvider>
    </AuthProvider>
  );
}
