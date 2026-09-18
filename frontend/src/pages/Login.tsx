// src/pages/Login.tsx
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { Lock, Mail, LogIn, ShieldAlert, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner'; // 👈 1. Importar toast

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
      
      // 👈 2. Mostrar la notificación de bienvenida con el nombre
      toast.success(`¡Bienvenido, ${usuario.nombre}!`);

      navigate('/admin'); // Redirige al panel CRUD tras autenticarse
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... tu código JSX actual se mantiene exactamente igual
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 relative">
      {/* Botón Regresar al Inicio (Responsivo sin traslapes) */}
      <div className="w-full max-w-md mb-4 flex justify-start md:absolute md:top-6 md:left-6 md:mb-0">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 px-3.5 py-2 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Regresar al Inicio</span>
        </Link>
      </div>

      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600/20 text-blue-500 rounded-full mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-white">Acceso Administrativo</h2>
          <p className="text-slate-400 text-sm mt-1">Directorio Empresarial</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400 text-sm">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@directorio.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2"
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

        {/* Botón para abrir el Modal de Crear Cuenta */}
        {/* <div className="mt-6 pt-6 border-t border-slate-700/60 text-center">
          <p className="text-xs text-slate-400 mb-3">
            ¿Aún no tienes una cuenta registrada?
          </p>
          <button
            type="button"
            onClick={() => setIsRegisterOpen(true)}
            className="inline-flex items-center justify-center gap-2 w-full py-2 px-4 bg-slate-700/50 hover:bg-slate-700 text-slate-200 border border-slate-600/50 rounded-lg text-sm transition-colors font-medium"
          >
            <UserPlus className="w-4 h-4 text-blue-400" />
            <span>Crear una cuenta</span>
          </button>
        </div> */}
      </div>
    </div>
  );
};