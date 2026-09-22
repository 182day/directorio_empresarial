// src/pages/UsersPage.tsx
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import { UserForm } from '../components/UserForm';
import { useUserStore } from '../stores/useUserStore';
import { type User, type UserFormData } from '../interfaces/user.interface';
import { Plus, Edit2, Trash2, Search, X, CheckCircle2, XCircle } from 'lucide-react';

export const UsersPage = () => {
    const { users, loading, fetchUsers, createUser, updateUser, deleteUser } = useUserStore();

    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Carga única inicial (si ya se cargó previamente en la app, no pedirá nada a la API)
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Búsqueda/Filtrado puramente en el cliente
    const filteredUsers = users.filter((u) =>
        u.nombre.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

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
                await updateUser(editingUser._id, formData);
                toast.success(`Usuario ${formData.nombre} actualizado correctamente.`);
            } else {
                await createUser(formData);
                toast.success(`Usuario ${formData.nombre} creado exitosamente.`);
            }
            closeModal();
        } catch (err: any) {
            const mensajeError =
                err.response?.data?.message ||
                err.response?.data?.error ||
                'Error al procesar la solicitud en el servidor.';
            throw new Error(mensajeError);
        }
    };

    const handleDelete = (id: string, nombre: string) => {
        Swal.fire({
            title: '¿Eliminar usuario?',
            html: `Está a punto de eliminar al usuario <strong style="color: inherit;">${nombre}</strong>. Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: '!bg-app-card !text-app-text !border !border-app-border'
            },
            allowOutsideClick: true,
            allowEscapeKey: true,
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteUser(id);
                    toast.success(`El usuario ${nombre} ha sido eliminado.`);
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
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-app-card border border-app-border rounded-lg py-2 pl-10 pr-4 text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-blue-500"
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

            {/* CONTADOR DE RESULTADOS ENCONTRADOS */}
            {!loading && filteredUsers.length > 0 && (
                <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-app-card/60 border border-app-border/60 px-4 py-2.5 rounded-lg text-sm text-app-text shadow-sm gap-1">
                    <span className="font-medium">
                        Se {filteredUsers.length === 1 ? 'encontró' : 'encontraron'}{' '}
                        <strong className="text-blue-500 font-semibold">{filteredUsers.length}</strong>{' '}
                        {filteredUsers.length === 1 ? 'resultado' : 'resultados'}
                    </span>

                    {search.trim() !== '' && filteredUsers.length !== users.length && (
                        <span className="text-xs text-app-muted">
                            (filtrados de un total de {users.length})
                        </span>
                    )}
                </div>
            )}

            {loading ? (
                <div className="bg-app-card border border-app-border rounded-xl p-8 text-center text-app-muted">
                    Cargando usuarios...
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="bg-app-card border border-app-border rounded-xl p-8 text-center text-app-muted">
                    No se encontraron usuarios registrados.
                </div>
            ) : (
                <div className="bg-app-card border border-app-border rounded-xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-app-text">
                            <thead className="bg-app-bg text-app-muted text-xs uppercase border-b border-app-border">
                                <tr>
                                    <th className="px-6 py-4">Usuario</th>
                                    <th className="px-6 py-4">Correo Electrónico</th>
                                    <th className="px-6 py-4">Rol</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-app-border/60">
                                {filteredUsers.map((u) => (
                                    <tr key={u._id} className="hover:bg-app-button/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-app-text">
                                            {u.nombre}
                                        </td>
                                        <td className="px-6 py-4 text-app-muted">
                                            {u.email}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 text-xs rounded border capitalize font-medium ${getRoleBadge(u.rol)}`}>
                                                {u.rol}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${u.activo
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                }`}>
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
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => openModal(u)}
                                                className="p-1.5 bg-app-button hover:bg-app-button-hover text-app-text rounded-md transition-colors"
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
                    <div className="bg-app-card border border-app-border rounded-2xl w-full max-w-lg p-6 shadow-2xl relative my-8">
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-app-muted hover:text-app-text p-1 rounded-lg hover:bg-app-button transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-bold text-app-text mb-6">
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