// src/components/UserForm.tsx
import { useState, useEffect } from 'react';

export interface UserFormData {
    nombre: string;
    email: string;
    password?: string;
    rol: 'admin' | 'editor' | 'lector';
    activo: boolean;
}

interface UserFormProps {
    initialData?: UserFormData;
    isEditing?: boolean;
    onSubmit: (formData: UserFormData) => Promise<void>;
    onCancel: () => void;
}

export const UserForm = ({ initialData, isEditing = false, onSubmit, onCancel }: UserFormProps) => {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rol, setRol] = useState<'admin' | 'editor' | 'lector'>('lector');
    const [activo, setActivo] = useState(true);

    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setNombre(initialData.nombre || '');
            setEmail(initialData.email || '');
            setRol(initialData.rol || 'lector');
            setActivo(initialData.activo ?? true);
            setPassword(''); // En edición la contraseña inicia vacía
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!nombre.trim() || !email.trim()) {
            setError('El nombre y el correo electrónico son obligatorios.');
            return;
        }

        if (!isEditing && (!password || password.length < 6)) {
            setError('La contraseña es obligatoria y debe tener al menos 6 caracteres.');
            return;
        }

        try {
            setSubmitting(true);
            await onSubmit({
                nombre,
                email,
                ...(password.trim() !== '' && { password }),
                rol,
                activo
            });
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error al procesar el usuario.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nombre Completo *
                </label>
                <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    required
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                    Correo Electrónico *
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@dominio.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    required
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                    {isEditing ? 'Nueva Contraseña (Opcional)' : 'Contraseña *'}
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isEditing ? 'Dejar en blanco para mantener la actual' : 'Mínimo 6 caracteres'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                        Rol de Usuario
                    </label>
                    <select
                        value={rol}
                        onChange={(e) => setRol(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                        <option value="lector">Lector</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Administrador</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                        Estado de la Cuenta
                    </label>
                    <button
                        type="button"
                        onClick={() => setActivo(!activo)}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-colors ${
                            activo
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                        }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${activo ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {activo ? 'Cuenta Activa' : 'Cuenta Inactiva'}
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/60 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
                >
                    {submitting ? 'Guardando...' : isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}
                </button>
            </div>
        </form>
    );
};