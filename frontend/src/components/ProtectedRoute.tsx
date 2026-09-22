import { useContext, type JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles?: Array<'admin' | 'editor' | 'lector'>;
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useContext(AuthContext);

  // 1. Mientras AuthContext comprueba si el token es válido o está cargando
  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg text-app-muted flex items-center justify-center">
        <p className="animate-pulse text-sm">Verificando sesión...</p>
      </div>
    );
  }

  // 2. Si no hay sesión activa, redirige al Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Si la ruta especifica roles permitidos y el usuario no tiene ninguno de ellos
  if (allowedRoles && user?.rol && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/dashboard/companies" replace />;
  }

  return children;
};