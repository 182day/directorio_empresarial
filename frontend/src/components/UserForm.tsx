// src/components/UserForm.tsx
import { useState, useEffect } from 'react';
import { Sun, Moon, CheckCircle } from 'lucide-react';
import { type UserFormData, type UserRole } from '../interfaces/user.interface';
import { useTheme } from '../context/ThemeContext';

interface UserFormProps {
    initialData?: UserFormData;
    isEditing?: boolean;
    isMyAccount?: boolean;
    onSubmit: (formData: UserFormData) => Promise<void>;
    onCancel?: () => void;
}

export const UserForm = ({
    initialData,
    isEditing = false,
    isMyAccount = false,
    onSubmit,
    onCancel
}: UserFormProps) => {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rol, setRol] = useState<UserRole>('lector');
    const [activo, setActivo] = useState(true);

    // Contexto global del tema visual
    const { theme, setTheme } = useTheme();

    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setNombre(initialData.nombre || '');
            setEmail(initialData.email || '');
            setRol(initialData.rol || 'lector');
            setActivo(initialData.activo ?? true);
            setPassword('');
            setConfirmPassword('');
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

        // Validación de contraseñas si se escribió una nueva
        if (password.trim() !== '') {
            if (password.length < 6) {
                setError('La contraseña debe tener al menos 6 caracteres.');
                return;
            }
            // Solo valida la coincidencia si estamos en el flujo de Mi Cuenta
            if (isMyAccount && password !== confirmPassword) {
                setError('Las contraseñas no coinciden.');
                return;
            }
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

            setPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error al procesar el usuario.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 p-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-xs font-medium text-app-muted mb-1">
                    Nombre Completo *
                </label>
                <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-2 text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-blue-500"
                    required
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-app-muted mb-1">
                    Correo Electrónico *
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@dominio.com"
                    className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-2 text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-blue-500"
                    required
                />
            </div>

            {/* Contraseñas */}
            <div className={`grid grid-cols-1 ${isMyAccount ? 'sm:grid-cols-2' : ''} gap-4`}>
                <div>
                    <label className="block text-xs font-medium text-app-muted mb-1">
                        {isEditing ? 'Nueva Contraseña (Opcional)' : 'Contraseña *'}
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={isEditing ? 'Dejar en blanco para mantener la actual' : 'Mínimo 6 caracteres'}
                        className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-2 text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-blue-500"
                    />
                </div>

                {/* Confirmar contraseña solo visible en Mi Cuenta */}
                {isMyAccount && (
                    <div>
                        <label className="block text-xs font-medium text-app-muted mb-1">
                            Confirmar Nueva Contraseña
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repite la contraseña"
                            disabled={!password}
                            className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-2 text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                )}
            </div>

            {/* Selección de Tema (Solo visible en Mi Cuenta) */}
            {isMyAccount && (
                <div>
                    <label className="block text-xs font-medium text-app-muted mb-1">
                        Tema de la Aplicación
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setTheme('dark')}
                            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${theme === 'dark'
                                    ? 'bg-blue-600/20 border-blue-500 text-blue-500 font-semibold'
                                    : 'bg-app-bg border-app-border text-app-muted hover:text-app-text'
                                }`}
                        >
                            <Moon className="w-4 h-4" />
                            Oscuro (Dark)
                        </button>
                        <button
                            type="button"
                            onClick={() => setTheme('light')}
                            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${theme === 'light'
                                    ? 'bg-blue-600/20 border-blue-500 text-blue-500 font-semibold'
                                    : 'bg-app-bg border-app-border text-app-muted hover:text-app-text'
                                }`}
                        >
                            <Sun className="w-4 h-4" />
                            Claro (Light)
                        </button>
                    </div>
                </div>
            )}

            {/* Rol y Estado solo se muestran en la gestión de usuarios (UsersPage) */}
            {!isMyAccount && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-app-muted mb-1">
                            Rol de Usuario
                        </label>
                        <select
                            value={rol}
                            onChange={(e) => setRol(e.target.value as UserRole)}
                            className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-2 text-sm text-app-text focus:outline-none focus:border-blue-500"
                        >
                            <option value="lector" className="bg-app-card text-app-text">Lector</option>
                            <option value="editor" className="bg-app-card text-app-text">Editor</option>
                            <option value="admin" className="bg-app-card text-app-text">Administrador</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-app-muted mb-1">
                            Estado de la Cuenta
                        </label>
                        <button
                            type="button"
                            onClick={() => setActivo(!activo)}
                            className={`w-full py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-colors ${activo
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                    : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${activo ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {activo ? 'Cuenta Activa' : 'Cuenta Inactiva'}
                        </button>
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-app-border">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 bg-app-border/40 hover:bg-app-border text-app-muted hover:text-app-text rounded-lg text-sm transition-colors"
                    >
                        Cancelar
                    </button>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors shadow-lg disabled:opacity-50 cursor-pointer"
                >
                    <CheckCircle className="w-4 h-4" />
                    <span>
                        {submitting
                            ? 'Guardando...'
                            : isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
                    </span>
                </button>
            </div>
        </form>
    );
};