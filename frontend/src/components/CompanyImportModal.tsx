// src/components/CompanyImportModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api/axios';
import Swal from 'sweetalert2';
import { toast } from 'sonner';

interface CompanyImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type StepStatus = 'idle' | 'uploading' | 'processing' | 'completed';

export const CompanyImportModal: React.FC<CompanyImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<StepStatus>('idle');
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [dbProgress, setDbProgress] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    // Función para limpiar completamente el estado del modal
    const resetForm = () => {
        setFile(null);
        setStatus('idle');
        setUploadProgress(0);
        setDbProgress(0);
        setError(null);

        // Limpiar el valor del input tipo file si existe en el DOM
        const input = document.getElementById('excel-file-input') as HTMLInputElement;
        if (input) {
            input.value = '';
        }
    };

    // Función para manejar el cierre del modal garantizando la limpieza del estado
    const handleClose = () => {
        if (status === 'uploading' || status === 'processing') return;
        resetForm();
        onClose();
    };

    // Simulación de progreso para la fase de base de datos
    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;

        if (status === 'processing') {
            setDbProgress(5);
            timer = setInterval(() => {
                setDbProgress((prev) => {
                    if (prev >= 95) {
                        clearInterval(timer);
                        return 95;
                    }
                    return prev + 5;
                });
            }, 250);
        } else if (status === 'completed') {
            setDbProgress(100);
        } else {
            setDbProgress(0);
        }

        return () => clearInterval(timer);
    }, [status]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const selectedFile = e.target.files?.[0];

        if (selectedFile) {
            const ext = selectedFile.name.split('.').pop()?.toLowerCase();
            if (ext !== 'xlsx') {
                setError('Solo se permiten archivos con formato .xlsx');
                setFile(null);
                return;
            }

            if (selectedFile.size > 50 * 1024 * 1024) {
                setError('El archivo supera el tamaño máximo permitido de 50MB.');
                setFile(null);
                return;
            }

            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Por favor selecciona un archivo .xlsx');
            return;
        }

        // Cuadro de confirmación antes de iniciar la importación
        Swal.fire({
            title: '¿Está seguro de importar el archivo?',
            html: `Está a punto de procesar e importar el archivo <strong style="color: inherit;">${file.name}</strong> a la base de datos.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb', // Azul para confirmar acción positiva
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, importar',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: '!bg-app-card !text-app-text !border !border-app-border'
            },
            allowOutsideClick: true,
            allowEscapeKey: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                const formData = new FormData();
                formData.append('archivo', file);

                setStatus('uploading');
                setUploadProgress(0);
                setError(null);

                try {
                    const res = await api.post('/companies/import-excel', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                        onUploadProgress: (progressEvent) => {
                            if (progressEvent.total) {
                                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                                setUploadProgress(percent);

                                if (percent >= 100) {
                                    setStatus('processing');
                                }
                            }
                        }
                    });

                    setStatus('completed');
                    toast.success(`Importado con éxito. Insertados: ${res.data.registrosInsertados}, Omitidos: ${res.data.registrosOmitidos}`);

                    setTimeout(() => {
                        onSuccess();
                        resetForm();
                        onClose();
                    }, 500);

                } catch (err: any) {
                    setStatus('idle');
                    const msg = err.response?.data?.message || 'Ocurrió un error al procesar el archivo.';
                    setError(msg);
                    toast.error(msg);
                }
            }
        });
    };

    const isWorking = status === 'uploading' || status === 'processing';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-app-card border border-app-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-app-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                        <h2 className="text-lg font-bold text-app-text">Importar Empresas desde Excel</h2>
                    </div>
                    <button onClick={handleClose} disabled={isWorking} className="text-app-muted hover:text-app-text transition-colors disabled:opacity-50">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="border-2 border-dashed border-app-border hover:border-blue-500 rounded-xl p-6 text-center transition-colors">
                        <input
                            type="file"
                            accept=".xlsx"
                            id="excel-file-input"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={isWorking}
                        />
                        <label htmlFor="excel-file-input" className="cursor-pointer flex flex-col items-center gap-2">
                            <Upload className="w-8 h-8 text-app-muted" />
                            <span className="text-sm font-medium text-app-text">
                                {file ? file.name : 'Haz clic para seleccionar o arrastra un archivo XLSX'}
                            </span>
                            <span className="text-xs text-app-muted">Máximo 50MB (.xlsx)</span>
                        </label>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* FASE 1: SUBIENDO ARCHIVO POR RED */}
                    {status === 'uploading' && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-medium text-app-muted">
                                <span className="flex items-center gap-1.5">
                                    <Upload className="w-3.5 h-3.5 animate-bounce text-blue-500" />
                                    Subiendo archivo al servidor...
                                </span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-app-bg border border-app-border rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-200"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* FASE 2: PROCESANDO REGISTROS EN BASE DE DATOS */}
                    {(status === 'processing' || status === 'completed') && (
                        <div className="space-y-2 animate-fade-in">
                            <div className="flex justify-between text-xs font-medium text-app-muted">
                                <span className="flex items-center gap-1.5 text-emerald-400">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Validando y registrando empresas en base de datos...
                                </span>
                                <span>{dbProgress}%</span>
                            </div>
                            <div className="w-full bg-app-bg border border-app-border rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300"
                                    style={{ width: `${dbProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="p-4 flex justify-end gap-3 border-t border-app-border">
                    <button
                        onClick={handleClose}
                        disabled={isWorking}
                        className="px-4 py-2 bg-app-border/40 hover:bg-app-border text-app-muted hover:text-app-text rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || isWorking}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors shadow-lg disabled:opacity-50 cursor-pointer"
                    >
                        {isWorking ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>{status === 'uploading' ? 'Subiendo...' : 'Procesando...'}</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Iniciar Importación</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};