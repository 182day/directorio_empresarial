// src/pages/UsersPage.tsx
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import api from '../api/axios';
import { UserForm, type UserFormData } from '../components/UserForm';
import {
    Plus, Edit2, Trash2, Search, X, CheckCircle2, XCircle
} from 'lucide-react';

interface User {
    _id: string;
    nombre: string;
    email: string;
    rol: 'admin' | 'editor' | 'lector';
    activo: boolean;
    createdAt?: string;
}

export const UsersPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    useEffect(() => {
        fetchUsers();
    }, [search]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/users', { params: { busqueda: search } });
            setUsers(res.data);
        } catch (err: any) {
            console.error('Error al cargar usuarios:', err);
            toast.error('No se pudo cargar la lista de usuarios.');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (user?: User) => {
        setEditingUser(user || null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleFormSubmit = async (formData: UserFormData) => {
        try {
            if (editingUser) {
                await api.put(`/users/${editingUser._id}`, formData);
                toast.success(`Usuario ${formData.nombre} actualizado correctamente.`);
            } else {
                await api.post('/users', formData);
                toast.success(`Usuario ${formData.nombre} creado exitosamente.`);
            }

            closeModal();
            fetchUsers();
        } catch (err: any) {
            const mensajeError =
                err.response?.data?.message ||
                err.response?.data?.error ||
                'Error al procesar la solicitud en el servidor.';

            throw new Error(mensajeError);
        }
    };

    const handleToggleStatus = async (user: User) => {
        try {
            const nuevoEstado = !user.activo;
            await api.put(`/users/${user._id}`, { activo: nuevoEstado });

            toast.success(
                `Cuenta de ${user.nombre} ${nuevoEstado ? 'activada' : 'desactivada'}.`
            );
            fetchUsers();
        } catch (err: any) {
            toast.error('No se pudo cambiar el estado del usuario.');
        }
    };

    const handleDelete = (id: string, nombre: string) => {
        Swal.fire({
            title: '¿Eliminar usuario?',
            html: `Está a punto de eliminar al usuario <strong style="color: #fff;">${nombre}</strong>. Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#334155',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            background: '#1e293b',
            color: '#f8fafc',
            allowOutsideClick: true,
            allowEscapeKey: true,
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`/users/${id}`);
                    toast.success(`El usuario ${nombre} ha sido eliminado.`);
                    fetchUsers();
                } catch (err: any) {
                    const mensajeError = err.response?.data?.message || 'Error al eliminar el usuario.';
                    toast.error(mensajeError);
                }
            }
        });
    };

    const getRoleBadge = (rol: string) => {
        switch (rol) {
            case 'admin':
                return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'editor':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            default:
                return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                </div>

                <button
                    onClick={() => openModal()}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-lg"
                >
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Usuario</span>
                </button>
            </div>

            {loading ? (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
                    Cargando usuarios...
                </div>
            ) : users.length === 0 ? (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
                    No se encontraron usuarios registrados.
                </div>
            ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase border-b border-slate-700">
                                <tr>
                                    <th className="px-6 py-4">Usuario</th>
                                    <th className="px-6 py-4">Correo Electrónico</th>
                                    <th className="px-6 py-4">Rol</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/60">
                                {users.map((u) => (
                                    <tr key={u._id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">
                                            {u.nombre}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            {u.email}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 text-xs rounded border capitalize font-medium ${getRoleBadge(u.rol)}`}>
                                                {u.rol}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleStatus(u)}
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${u.activo
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                                                    }`}
                                                title="Hacer clic para cambiar estado"
                                            >
                                                {u.activo ? (
                                                    <>
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        <span>Activo</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        <span>Inactivo</span>
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => openModal(u)}
                                                className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md transition-colors"
                                                title="Editar Usuario"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(u._id, u.nombre)}
                                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md border border-red-500/20 transition-colors"
                                                title="Eliminar Usuario"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal de Usuario */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative my-8">
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-bold text-white mb-6">
                            {editingUser ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
                        </h3>

                        <UserForm
                            isEditing={!!editingUser}
                            initialData={
                                editingUser
                                    ? {
                                        nombre: editingUser.nombre,
                                        email: editingUser.email,
                                        rol: editingUser.rol,
                                        activo: editingUser.activo,
                                    }
                                    : undefined
                            }
                            onSubmit={handleFormSubmit}
                            onCancel={closeModal}
                        />
                    </div>
                </div>
            )}
        </>
    );
};