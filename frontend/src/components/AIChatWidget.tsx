// src/components/AIChatWidget.tsx
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Bot, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import api from '../api/axios';

interface ChatMessage {
    role: 'user' | 'assistant';
    texto: string;
}

const SUGERENCIAS = [
    '¿Cuántas empresas activas hay por estado?',
    '¿Cuál es el sector con más empresas registradas?',
    'Dame un resumen general del sistema'
];

const MENSAJE_INICIAL: ChatMessage = {
    role: 'assistant',
    texto: 'Hola 👋 Puedo responder preguntas sobre las empresas y seguimientos registrados en el sistema, además de la bitácora y los usuarios. ¿Qué quieres saber?'
};

// ---------------------------------------------------------------------------
// Formateador ligero de markdown: la IA regresa **negritas** y listas
// (1. 2. / * -), y como no usamos una librería de markdown completa,
// convertimos manualmente esos patrones a JSX legible.
// ---------------------------------------------------------------------------
function formatearLinea(linea: string, key: number): ReactNode {
    const partes = linea.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

    const contenido = partes.map((parte, i) =>
        parte.startsWith('**') && parte.endsWith('**') ? (
            <strong key={i} className="font-semibold">
                {parte.slice(2, -2)}
            </strong>
        ) : (
            <span key={i}>{parte}</span>
        )
    );

    const esViñeta = /^[*-]\s+/.test(linea.trim());
    const lineaLimpia = esViñeta ? linea.trim().replace(/^[*-]\s+/, '') : null;

    if (esViñeta) {
        const partesViñeta = lineaLimpia!.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
        return (
            <p key={key} className="flex gap-1.5">
                <span className="text-app-muted">•</span>
                <span>
                    {partesViñeta.map((parte, i) =>
                        parte.startsWith('**') && parte.endsWith('**') ? (
                            <strong key={i} className="font-semibold">
                                {parte.slice(2, -2)}
                            </strong>
                        ) : (
                            <span key={i}>{parte}</span>
                        )
                    )}
                </span>
            </p>
        );
    }

    if (linea.trim() === '') return <div key={key} className="h-1.5" />;

    return <p key={key}>{contenido}</p>;
}

function renderMensaje(texto: string): ReactNode {
    return <div className="space-y-0.5">{texto.split('\n').map((linea, i) => formatearLinea(linea, i))}</div>;
}

export const AIChatWidget = () => {
    const [abierto, setAbierto] = useState(false);
    const [mensajes, setMensajes] = useState<ChatMessage[]>([MENSAJE_INICIAL]);
    const [entrada, setEntrada] = useState('');
    const [cargando, setCargando] = useState(false);
    const finRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (abierto) {
            finRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [mensajes, abierto, cargando]);

    // Bloquea el scroll del body cuando el chat está abierto en pantallas chicas,
    // para que no se sienta como si "hubiera dos scrolls" a la vez.
    useEffect(() => {
        if (abierto && window.innerWidth < 640) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [abierto]);

    const enviarMensaje = async (texto: string) => {
        const contenido = texto.trim();
        if (!contenido || cargando) return;

        const nuevosMensajes = [...mensajes, { role: 'user', texto: contenido } as ChatMessage];
        setMensajes(nuevosMensajes);
        setEntrada('');
        setCargando(true);

        try {
            const historial = nuevosMensajes.slice(-10);
            const { data } = await api.post('/ai/chat', { mensaje: contenido, historial });
            setMensajes((prev) => [...prev, { role: 'assistant', texto: data.respuesta }]);
        } catch (err: any) {
            const mensajeError =
                err.response?.data?.message || 'No se pudo consultar al asistente. Intenta de nuevo.';
            toast.error(mensajeError);
            // Quitamos el mensaje del usuario que no pudo procesarse, para que pueda reintentar limpio
            setMensajes(mensajes);
        } finally {
            setCargando(false);
        }
    };

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        enviarMensaje(entrada);
    };

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-100 flex flex-col items-end">
            {abierto && (
                <div
                    className="fixed inset-x-3 top-[max(1rem,env(safe-area-inset-top))] bottom-[max(1rem,env(safe-area-inset-bottom))]
                    flex flex-col overflow-hidden rounded-2xl border border-app-border bg-app-card shadow-2xl
                    sm:static sm:inset-auto sm:mb-3 sm:w-96 sm:h-[min(32rem,calc(100vh-7rem))] sm:max-h-128"
                >
                    {/* Encabezado */}
                    <div className="flex items-center justify-between border-b border-app-border bg-app-bg px-4 py-3 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-500">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-app-text">Asistente de datos</p>
                                <p className="text-xs text-app-muted">Empresas y seguimientos</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setAbierto(false)}
                            className="p-1.5 text-app-muted hover:text-app-text hover:bg-app-button rounded-md transition-colors"
                            title="Cerrar chat"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Mensajes */}
                    <div className="flex-1 min-h-0 space-y-3 overflow-y-auto px-3 py-4">
                        {mensajes.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {m.role === 'assistant' && (
                                    <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-app-button text-app-muted">
                                        <Bot className="h-3.5 w-3.5" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[85%] wrap-break-words rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                                        m.role === 'user'
                                            ? 'rounded-br-sm bg-blue-600 text-white'
                                            : 'rounded-bl-sm border border-app-border bg-app-bg text-app-text'
                                    }`}
                                >
                                    {m.role === 'assistant' ? renderMensaje(m.texto) : m.texto}
                                </div>
                            </div>
                        ))}

                        {cargando && (
                            <div className="flex justify-start">
                                <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-app-button text-app-muted">
                                    <Bot className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-app-border bg-app-bg px-3 py-2.5">
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-app-muted [animation-delay:-0.3s]" />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-app-muted [animation-delay:-0.15s]" />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-app-muted" />
                                </div>
                            </div>
                        )}

                        {mensajes.length === 1 && !cargando && (
                            <div className="space-y-2 pt-1">
                                {SUGERENCIAS.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => enviarMensaje(s)}
                                        className="block w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-left text-xs text-app-muted hover:text-app-text hover:border-blue-500/40 transition-colors"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div ref={finRef} />
                    </div>

                    {/* Entrada */}
                    <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-app-border p-3 shrink-0">
                        <input
                            type="text"
                            value={entrada}
                            onChange={(e) => setEntrada(e.target.value)}
                            placeholder="Escribe tu pregunta..."
                            className="flex-1 min-w-0 bg-app-bg border border-app-border rounded-lg px-3 py-2 text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-blue-500"
                            disabled={cargando}
                        />
                        <button
                            type="submit"
                            disabled={cargando || !entrada.trim()}
                            className="flex shrink-0 items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white p-2.5 rounded-lg transition-colors shadow-lg"
                            title="Enviar"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}

            {/* Botón flotante */}
            <button
                onClick={() => setAbierto((v) => !v)}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-xl transition-colors"
                title={abierto ? 'Cerrar asistente' : 'Abrir asistente de IA'}
            >
                {abierto ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
            </button>
        </div>
    );
};