// src/layouts/AdminLayout.tsx
import { useState, useContext } from 'react';
//import api from '../api/axios';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { CompanyForm } from '../components/CompanyForm';
import { FolderSearch, Building2, Users, Menu, X, LogOut, LogIn, LayoutDashboard, History } from 'lucide-react';
//import { toast } from 'sonner';

export const AdminLayout = () => {
    const { user, logout } = useContext(AuthContext);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isPublicRegisterOpen, setIsPublicRegisterOpen] = useState(false); // 👈 Estado para abrir/cerrar el modal
    const location = useLocation();

    // Determinar ícono y título dinámico según la ruta
    const getHeaderInfo = () => {
        const path = location.pathname;

        if (path === '/') {
            return {
                title: 'Directorio Empresarial',
                icon: <FolderSearch className="w-6 h-6" />,
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

        return {
            title: 'Panel de Administración',
            icon: <LayoutDashboard className="w-6 h-6" />,
        };
    };

    const currentHeader = getHeaderInfo();

    // Handler para registrar la empresa mediante la API/Backend
    // const handlePublicRegistrationSubmit = async (formData: any) => {
    //     console.log('hola');
        
    //     try {
    //         // Axios usará la URL base del backend y el endpoint /empresas/public
    //         await api.post('/companies/public', formData);
    //         //setIsPublicRegisterOpen(false);
    //     } catch (error: any) {
    //         // Captura el mensaje de error retornado por Express

    //         //const mensaje = error.response?.data?.message || 'Error al enviar el registro';
    //         //throw new Error(mensaje);

    //         throw error;
    //     }
    // };

    // function closeModal(event: MouseEvent<HTMLButtonElement, MouseEvent>): void {
    //     throw new Error('Function not implemented.');
    // }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
            {/* Topbar Superior */}
            <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-30">
                <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* El botón de abrir menú solo aparece si el usuario está autenticado */}
                        {user && (
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                title={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
                            >
                                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        )}

                        <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
                            {currentHeader.icon}
                        </div>
                        <h1 className="text-xl font-bold text-white">{currentHeader.title}</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {user ? (
                            <>
                                <span className="text-sm text-slate-400 hidden sm:inline">
                                    Hola, <strong className="text-white">{user.nombre}</strong>
                                </span>
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden sm:inline">Cerrar Sesión</span>
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Botón "Registrarse como empresa" (solo usuarios no logeados) */}
                                <button
                                    type="button"
                                    onClick={() => setIsPublicRegisterOpen(true)}
                                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-blue-400 hover:text-blue-300 border border-blue-500/30 px-3.5 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
                                >
                                    <Building2 className="w-4 h-4" />
                                    <span className="hidden md:inline">Registrarse como empresa</span>
                                    <span className="md:hidden">Registro Empresa</span>
                                </button>

                                {/* Botón "Acceso Admin" */}
                                <Link
                                    to="/login"
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md"
                                >
                                    <LogIn className="w-4 h-4" />
                                    <span>Acceso Admin</span>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Estructura Principal */}
            <div className="flex-1 flex overflow-hidden">
                {/* El menú lateral solo se renderiza si el usuario está autenticado */}
                {user && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}

                <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto transition-all">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Modal de Registro Público para Empresas */}
            {isPublicRegisterOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
                        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-400" />
                                Registrar Nueva Empresa
                            </h2>
                            <button onClick={() => setIsPublicRegisterOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 max-h-[80vh] overflow-y-auto no-scrollbar">
                            <CompanyForm
                                isPublicRegistration={true}
                                onCancel={() => setIsPublicRegisterOpen(false)}
                                //onSubmit={handlePublicRegistrationSubmit}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};