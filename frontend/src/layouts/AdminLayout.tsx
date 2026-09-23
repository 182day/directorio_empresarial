// src/layouts/AdminLayout.tsx
import { useState, useContext, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { CompanyForm } from '../components/CompanyForm';
import { ChartLine, Building2, Users, Menu, X, LogOut, LogIn, LayoutDashboard, History, Settings, ChartGantt } from 'lucide-react';
import { useCompanyStore } from '../stores/useCompanyStore';
import { AIChatWidget } from '../components/AIChatWidget';

export const AdminLayout = () => {
    const { user, logout } = useContext(AuthContext);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isPublicRegisterOpen, setIsPublicRegisterOpen] = useState(false);
    const location = useLocation();

    const fetchCompanies = useCompanyStore((state: any) => state.fetchCompanies);

    useEffect(() => {
        if (fetchCompanies) {
            fetchCompanies();
        }
    }, [fetchCompanies]);

    const getHeaderInfo = () => {
        const path = location.pathname;

        if (path === '/') {
            return {
                title: user ? 'Estadísticas' : 'Directorio Empresarial',
                icon: user ? <ChartLine className="w-6 h-6" /> : <Building2 className="w-6 h-6" />,
            };
        }

        if (path.startsWith('/empresas/seguimientos')) {
            return {
                title: 'Seguimientos',
                icon: <ChartGantt className="w-6 h-6" />,
            };
        }

        if (path.startsWith('/empresas') || path.startsWith('/companies')) {
            return {
                title: 'Empresas',
                icon: <Building2 className="w-6 h-6" />,
            };
        }

        if (path.startsWith('/usuarios')) {
            return {
                title: 'Usuarios',
                icon: <Users className="w-6 h-6" />,
            };
        }

        if (path.startsWith('/auditoria')) {
            return {
                title: 'Auditoría',
                icon: <History className="w-6 h-6" />,
            };
        }

        if (path.startsWith('/micuenta')) {
            return {
                title: 'Mi Cuenta',
                icon: <Settings className="w-6 h-6" />,
            };
        }

        return {
            title: 'Panel de Administración',
            icon: <LayoutDashboard className="w-6 h-6" />,
        };
    };

    const currentHeader = getHeaderInfo();

    return (
        <div className="h-screen bg-app-bg text-app-text flex flex-col overflow-hidden transition-colors duration-200">
            {/* Topbar Superior */}
            <header className="bg-app-card border-b border-app-border z-30 shrink-0 transition-colors duration-200">
                <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Botón Abrir / Cerrar Menú */}
                        {user && (
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 rounded-lg bg-app-button hover:bg-app-button-hover text-app-text transition-colors"
                                title={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
                            >
                                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        )}

                        {/* Ícono de la vista actual */}
                        <div className="p-2 bg-blue-600/20 text-blue-500 rounded-lg">
                            {currentHeader.icon}
                        </div>

                        {/* Título */}
                        <h1 className="text-xl font-bold text-app-text hidden min-[400px]:block">
                            {currentHeader.title}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {user ? (
                            <>
                                <AIChatWidget />
                                <span className="text-sm text-app-muted hidden sm:inline">
                                    Hola, <strong className="text-app-text">{user.nombre}</strong>
                                </span>
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden sm:inline">Cerrar Sesión</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setIsPublicRegisterOpen(true)}
                                    className="flex items-center gap-2 bg-app-button hover:bg-app-button-hover text-blue-500 border border-app-border px-3.5 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
                                    title="Registrarse como empresa"
                                >
                                    <Building2 className="w-4 h-4" />
                                    <span className="hidden md:inline">Registrarse como empresa</span>
                                    <span className="md:hidden hidden sm:inline">Registro Empresa</span>
                                </button>

                                <Link
                                    to="/login"
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md"
                                    title="Acceso Admin"
                                >
                                    <LogIn className="w-4 h-4" />
                                    <span className="hidden sm:inline">Acceso Admin</span>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Estructura Principal */}
            <div className="flex-1 flex overflow-hidden w-full h-full relative">
                {user && (
                    <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                )}

                {/* Backdrop en responsivo */}
                {user && isSidebarOpen && (
                    <div
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 top-16 bg-slate-950/50 backdrop-blur-[2px] z-30 lg:hidden cursor-pointer"
                    />
                )}

                {/* Área de contenido */}
                <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto transition-all h-full">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Modal de Registro Público */}
            {isPublicRegisterOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-app-card border border-app-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
                        <div className="p-6 border-b border-app-border flex items-center justify-between">
                            <h2 className="text-lg font-bold text-app-text flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-500" />
                                Registrar Nueva Empresa
                            </h2>
                            <button onClick={() => setIsPublicRegisterOpen(false)} className="text-app-muted hover:text-app-text transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 max-h-[80vh] overflow-y-auto no-scrollbar">
                            <CompanyForm
                                isPublicRegistration={true}
                                onCancel={() => setIsPublicRegisterOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};