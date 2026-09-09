// src/Router.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Vistas Públicas / Generales
import { Directory } from './pages/Directory';
import { Login } from './pages/Login';

// Layout y Vistas
import { AdminLayout } from './layouts/AdminLayout';
import { CompaniesPage } from './pages/CompaniesPage';
import { UsersPage } from './pages/UsersPage';

function Router() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública de Login sin menú */}
          <Route path="/login" element={<Login />} />

          {/* Layout Principal (sirve tanto para usuarios públicos como autenticados) */}
          <Route element={<AdminLayout />}>
            {/* Directorio disponible para todos */}
            <Route path="/" element={<Directory />} />

            {/* Rutas protegidas dentro del mismo layout */}
            <Route
              path="/empresas"
              element={
                <ProtectedRoute>
                  <CompaniesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default Router;