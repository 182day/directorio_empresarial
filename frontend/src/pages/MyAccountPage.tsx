// src/pages/MyAccountPage.tsx
import { useContext, useState, useEffect } from 'react';
import { AuthContext, type User } from '../context/AuthContext';
import { UserForm, type UserFormData } from '../components/UserForm';
import { User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';

export const MyAccountPage = () => {
    const { user: authUser } = useContext(AuthContext);
    const [currentUser, setCurrentUser] = useState<User | null>(authUser);

    useEffect(() => {
        if (authUser) {
            setCurrentUser(authUser);
        }
    }, [authUser]);

    if (!currentUser) {
        return (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
                Cargando información del usuario...
            </div>
        );
    }

    const initialFormData: UserFormData = {
        nombre: currentUser.nombre,
        email: currentUser.email,
        rol: currentUser.rol,
        activo: true,
    };

    const handleSubmit = async (formData: UserFormData) => {
        try {
            const res = await api.put(`/users/${currentUser.id}`, formData);
            
            const updatedUser = res.data.user || res.data;
            setCurrentUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            toast.success('Información de la cuenta actualizada correctamente');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al actualizar el perfil');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-700/60">
                <div className="p-3 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20">
                    <UserIcon className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white">Mi Cuenta</h1>
                    <p className="text-xs text-slate-400">Gestiona tu información personal y credenciales de acceso</p>
                </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
                <UserForm
                    initialData={initialFormData}
                    isEditing={true}
                    isMyAccount={true} // 👈 Deshabilita Rol, Estatus y requiere Confirmar Contraseña
                    onSubmit={handleSubmit}
                />
            </div>
        </div>
    );
};