// src/pages/Login.tsx
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { Lock, Mail, LogIn, ShieldAlert, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      
      const usuario = response.data.user;
      login(usuario, response.data.token);
      
      toast.success(`¡Bienvenido, ${usuario.nombre}!`);

      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col justify-center items-center p-4 relative transition-colors duration-200">
      {/* Botón Regresar al Inicio */}
      <div className="w-full max-w-md mb-4 flex justify-start md:absolute md:top-6 md:left-6 md:mb-0">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-app-muted hover:text-app-text transition-colors bg-app-card border border-app-border px-3.5 py-2 rounded-lg shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Regresar al Inicio</span>
        </Link>
      </div>

      <div className="w-full max-w-md bg-app-card border border-app-border rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600/20 text-blue-500 rounded-full mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-app-text">Acceso Administrativo</h2>
          <p className="text-app-muted text-sm mt-1">Directorio Empresarial</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-500 dark:text-red-400 text-sm">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-app-muted mb-2">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-app-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@directorio.com"
                className="w-full bg-app-bg border border-app-border rounded-lg py-2.5 pl-10 pr-4 text-app-text placeholder-app-muted focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-app-muted mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-app-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-app-bg border border-app-border rounded-lg py-2.5 pl-10 pr-4 text-app-text placeholder-app-muted focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2 shadow-md"
          >
            {loading ? (
              <span>Iniciando sesión...</span>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Ingresar al Sistema</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};