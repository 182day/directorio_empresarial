// src/components/Sidebar.tsx
import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    FolderSearch, Building2, Users, /*BarChart2,*/ ChartGantt, History, Settings, X, ChevronRight
} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { user } = useContext(AuthContext);

    // Las rutas ahora coinciden exactamente con la estructura del Router.tsx
    const navItems = [
        {
            path: '/',
            label: 'Directorio',
            icon: FolderSearch,
            allowedRoles: ['admin', 'editor', 'lector']
        },
        {
            path: '/empresas',
            label: 'Empresas',
            icon: Building2,
            allowedRoles: ['admin', 'editor', 'lector']
        },
        {
            path: '/usuarios',
            label: 'Usuarios',
            icon: Users,
            allowedRoles: ['admin']
        },
        {
            path: '/empresas/seguimientos',
            label: 'Seguimientos',
            icon: ChartGantt,
            allowedRoles: ['admin', 'editor', 'lector']
        },
        {
            path: '/auditoria',
            label: 'Auditoría',
            icon: History,
            allowedRoles: ['admin']
        },
        {
            path: '/micuenta',
            label: 'Mi Cuenta',
            icon: Settings,
            allowedRoles: ['admin', 'editor', 'lector']
        },
    ];

    // Filtramos las opciones del menú según el rol del usuario logueado
    const filteredNavItems = navItems.filter((item) =>
        user?.rol ? item.allowedRoles.includes(user.rol) : false
    );

    return (
        <aside
            className={`bg-slate-800 border-r border-slate-700 transition-all duration-300 ease-in-out flex flex-col shrink-0 h-full ${isOpen ? 'w-64' : 'w-0 overflow-hidden border-none'
                }`}
        >
            {/* Cabecera del sidebar */}
            <div className="p-4 border-b border-slate-700/60 flex items-center justify-between shrink-0">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Navegación
                </span>
                <button onClick={onClose} className="...">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <nav className="p-3 space-y-1 flex-1 overflow-y-auto text-sm">
                {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            // Agregamos '/empresas' para que solo se active en su ruta exacta y no coincida con '/empresas/seguimientos'
                            end={item.path === '/' || item.path === '/empresas'}
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