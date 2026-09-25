// src/controllers/aiController.groq.ts
//
// Versión alterna del controlador usando Groq en vez de Gemini.
// Groq expone una API 100% compatible con el formato de OpenAI (chat
// completions + tool calling), así que reutilizamos AI_TOOLS de aiTools.ts
// prácticamente sin cambios (el JSON Schema en minúsculas ya es el formato
// correcto, a diferencia de Gemini que pedía mayúsculas).
//
// Requiere:
//   npm install groq-sdk
//   variable de entorno GROQ_API_KEY (gratis, sin tarjeta, en https://console.groq.com/keys)
//
// Para activarla: renombra este archivo a aiController.ts (guardando antes
// la versión de Gemini con otro nombre, por si quieres volver a probarla).

import { Response } from 'express';
import Groq from 'groq-sdk';
import { AuthRequest } from '../middlewares/authMiddleware';
import { AI_TOOLS, ejecutarHerramienta } from '../services/aiTools';

// Instanciamos el cliente de forma diferida (no al cargar el módulo), para
// evitar el típico bug de "la API key llega vacía" cuando dotenv.config()
// corre después de que Node importó este archivo.
let groq: Groq | null = null;
function obtenerClienteGroq(): Groq {
  if (!groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error(
        'GROQ_API_KEY no está definida en process.env. Revisa tu .env y que dotenv.config() corra antes de manejar requests.'
      );
    }
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

// Modelo del tier gratuito con buen soporte de tool calling y disponibilidad
// consistente. Si tu cuenta sí tiene acceso a 'llama-3.3-70b-versatile' (más
// grande, mejor calidad) puedes probarlo, pero algunos proyectos/regiones no
// lo tienen habilitado. Lista completa y actualizada para TU cuenta en
// https://console.groq.com/docs/models (revisa ahí antes de cambiarlo).
const MODEL = 'openai/gpt-oss-120b';
const MAX_TOOL_ITERATIONS = 6;

const SYSTEM_PROMPT = `
Eres el asistente de datos de una plataforma de registro de empresas (parques industriales / desarrollo económico).
Respondes SIEMPRE en español, de forma clara, breve y en tono profesional.

Reglas importantes:
- Solo puedes hablar de información que obtengas llamando a las herramientas disponibles.
  Nunca inventes empresas, cifras, contactos ni datos que no vengan de una herramienta.
- Si una herramienta no regresa resultados, dilo honestamente ("no encontré empresas que cumplan
  ese criterio") en vez de inventar una respuesta.
- Si la pregunta es ambigua, usa tu mejor criterio para elegir los filtros de búsqueda más razonables.
- Cuando el usuario pida "cuántas", "top", "distribución" o cifras agregadas, usa las herramientas
  de estadísticas en vez de listar empresas una por una.
- No expongas datos de contacto personal (teléfonos, correos) salvo que el usuario pregunte
  específicamente por el detalle de una empresa concreta.
- Sé conciso: prioriza listas cortas en texto plano sobre párrafos largos.
`.trim();

// Convierte AI_TOOLS (formato Claude: name/description/input_schema) al
// formato "function tool" que espera la API estilo OpenAI/Groq.
const GROQ_TOOLS = AI_TOOLS.map((tool) => ({
  type: 'function' as const,
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.input_schema
  }
}));

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

// POST /api/ai/chat
// body: { mensaje: string, historial?: { role: 'user'|'assistant', texto: string }[] }
export const chatConIA = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mensaje, historial } = req.body as {
      mensaje?: string;
      historial?: { role: 'user' | 'assistant'; texto: string }[];
    };

    if (!mensaje || !mensaje.trim()) {
      res.status(400).json({ message: 'El mensaje no puede estar vacío.' });
      return;
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(historial || []).slice(-10).map((h) => ({ role: h.role, content: h.texto })),
      { role: 'user', content: mensaje.trim() }
    ];

    let respuestaFinal = '';
    let iteraciones = 0;

    while (iteraciones < MAX_TOOL_ITERATIONS) {
      iteraciones += 1;

      const response = await obtenerClienteGroq().chat.completions.create({
        model: MODEL,
        messages: messages as any,
        tools: GROQ_TOOLS as any,
        max_tokens: 1024
      });

      const choice = response.choices[0];
      const mensajeModelo = choice.message;

      // Guardamos el turno del asistente (puede traer texto y/o tool_calls)
      messages.push({
        role: 'assistant',
        content: mensajeModelo.content || '',
        tool_calls: mensajeModelo.tool_calls
      });

      if (!mensajeModelo.tool_calls || mensajeModelo.tool_calls.length === 0) {
        respuestaFinal = (mensajeModelo.content || '').trim();
        break;
      }

      // Ejecutamos cada función solicitada y regresamos los resultados
      const resultados = await Promise.all(
        mensajeModelo.tool_calls.map(async (tc: any) => {
          let resultado: any;
          try {
            const args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
            resultado = await ejecutarHerramienta(tc.function.name, args);
          } catch (err: any) {
            resultado = { error: `Error ejecutando ${tc.function.name}: ${err?.message || err}` };
          }
          return {
            role: 'tool' as const,
            tool_call_id: tc.id,
            content: JSON.stringify(resultado)
          };
        })
      );

      messages.push(...resultados);
    }

    if (!respuestaFinal) {
      respuestaFinal =
        'No pude generar una respuesta completa con la información disponible. ¿Puedes reformular tu pregunta?';
    }

    res.status(200).json({ respuesta: respuestaFinal });
  } catch (error: any) {
    console.error('Error en chatConIA (Groq):', error);
    res.status(500).json({
      message: 'Error al procesar la consulta con la IA.',
      error: error?.message || error
    });
  }
};