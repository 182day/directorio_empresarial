// src/pages/MyAccountPage.tsx
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { UserForm } from '../components/UserForm';
import { type UserFormData } from '../interfaces/user.interface';
import { User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';

export const MyAccountPage = () => {
    const { user, updateUser } = useContext(AuthContext);
    
    if (!user) {
        return (
            <div className="bg-app-card border border-app-border rounded-xl p-8 text-center text-app-muted">
                Cargando información del usuario...
            </div>
        );
    }

    const initialFormData: UserFormData = {
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        activo: user.activo ?? true,
    };

    const handleSubmit = async (formData: UserFormData) => {
        try {
            const userId = user._id || (user as any).id;
            const res = await api.put(`/users/${userId}`, formData);

            const updatedUser = res.data.user || res.data;

            // 👈 2. Actualiza AuthContext. Esto actualizará instantáneamente el header en AdminLayout.tsx
            updateUser(updatedUser);

            toast.success('Información de la cuenta actualizada correctamente');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al actualizar el perfil');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-app-border">
                <div className="p-3 bg-blue-600/10 text-blue-500 rounded-xl border border-blue-500/20">
                    <UserIcon className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-app-text">Mi Cuenta</h1>
                    <p className="text-xs text-app-muted">Gestiona tu información personal y credenciales de acceso</p>
                </div>
            </div>

            <div className="bg-app-card border border-app-border rounded-2xl p-6 shadow-xl">
                <UserForm
                    initialData={initialFormData}
                    isEditing={true}
                    isMyAccount={true}
                    onSubmit={handleSubmit}
                />
            </div>
        </div>
    );
};