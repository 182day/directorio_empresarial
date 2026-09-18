// src/components/Sidebar.tsx
import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    ChartLine, Building2, Users, ChartGantt, History, Settings, X, ChevronRight
} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { user } = useContext(AuthContext);

    const navItems = [
        { path: '/', label: 'Estadísticas', icon: ChartLine, allowedRoles: ['admin', 'editor', 'lector'] },
        { path: '/empresas', label: 'Empresas', icon: Building2, allowedRoles: ['admin', 'editor', 'lector'] },
        { path: '/empresas/seguimientos', label: 'Seguimientos', icon: ChartGantt, allowedRoles: ['admin', 'editor', 'lector'] },
        { path: '/auditoria', label: 'Auditoría', icon: History, allowedRoles: ['admin'] },
        { path: '/usuarios', label: 'Usuarios', icon: Users, allowedRoles: ['admin'] },
        { path: '/micuenta', label: 'Mi Cuenta', icon: Settings, allowedRoles: ['admin', 'editor', 'lector'] },
    ];

    const filteredNavItems = navItems.filter((item) =>
        user?.rol ? item.allowedRoles.includes(user.rol) : false
    );

    return (
        <aside
            className={`fixed lg:relative top-16 lg:top-0 left-0 z-40 lg:z-auto bg-slate-800 border-r border-slate-700 
                transition-all duration-300 ease-in-out flex flex-col shrink-0 h-[calc(100vh-4rem)] lg:h-full 
                ${isOpen
                    ? 'w-full sm:w-64 translate-x-0' // 👈 100% de ancho en móviles (<640px) y 256px a partir de 'sm'
                    : '-translate-x-full lg:translate-x-0 lg:w-0 overflow-hidden border-none'
                }`}
        >
            {/* Cabecera del sidebar */}
            <div className="p-4 border-b border-slate-700/60 flex items-center justify-between shrink-0">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Navegación
                </span>
                <button
                    onClick={onClose}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <nav className="p-3 space-y-1 flex-1 overflow-y-auto text-sm">
                {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/' || item.path === '/empresas'}
                            onClick={() => {
                                // Cierra el menú al presionar una opción en dispositivos móviles
                                if (window.innerWidth < 1024) onClose();
                            }}
                            className={({ isActive }) =>
                                `flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors font-medium ${isActive
                                    ? 'bg-blue-600/20 text-blue-400'
                                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                                }`
                            }
                        >
                            <div className="flex items-center gap-3">
                                <Icon className="w-4 h-4" />
                                <span>{item.label}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-60" />
                        </NavLink>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-700/60 text-xs text-slate-500 text-center">
                Catálogo Desarrollo Empresarial v1.0
            </div>
        </aside>
    );
};