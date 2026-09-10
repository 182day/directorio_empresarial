// src/context/AuthContext.tsx
import { createContext, useState, useEffect, type ReactNode } from 'react';
import api from '../api/axios'; // Importa tu instancia configurada de Axios

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'editor' | 'lector'; // 👈 Cambiado de role?: string a rol explícito
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Carga previa inmediata desde localStorage para velocidad visual
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // Validación real contra la API para asegurar que el token sea legítimo
        const response = await api.get('/auth/verify');
        setUser(response.data.user || response.data);
        //console.log(response.data);
        
      } catch (error) {
        console.error('Sesión inválida o expirada:', error);
        logout(); // Si el token falló, limpiamos almacenamiento
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};