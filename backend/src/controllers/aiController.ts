// src/controllers/aiController.ts
import { Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { AuthRequest } from '../middlewares/authMiddleware';
import { AI_TOOLS, ejecutarHerramienta } from '../services/aiTools';

// Se instancia únicamente cuando entra una petición HTTP, garantizando la carga del .env
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('La variable de entorno GEMINI_API_KEY no está definida en el archivo .env');
  }
  return new GoogleGenAI({ apiKey });
};

// Nombre oficial soportado por la API de Gemini
const MODEL = 'gemini-3.6-flash';
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
- Sé conciso: prioriza tablas o listas cortas en texto plano sobre párrafos largos.
`.trim();

// Adaptador: convierte el esquema de herramientas al formato de tipos en mayúscula exigido por Gemini
function convertirSchemaAGemini(schema: any): any {
  if (!schema || typeof schema !== 'object') return schema;

  const convertido: any = { ...schema };

  if (typeof convertido.type === 'string') {
    convertido.type = convertido.type.toUpperCase();
  }
  if (convertido.properties) {
    convertido.properties = Object.fromEntries(
      Object.entries(convertido.properties).map(([key, val]) => [key, convertirSchemaAGemini(val)])
    );
  }
  if (convertido.items) {
    convertido.items = convertirSchemaAGemini(convertido.items);
  }

  return convertido;
}

const GEMINI_TOOLS = [
  {
    functionDeclarations: AI_TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: convertirSchemaAGemini(tool.input_schema)
    }))
  }
];

interface GeminiContent {
  role: 'user' | 'model';
  parts: any[];
}

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

    // Inicializamos el cliente al recibir el request
    const ai = getGeminiClient();

    const contents: GeminiContent[] = (historial || []).slice(-10).map((h) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.texto }]
    }));

    contents.push({ role: 'user', parts: [{ text: mensaje.trim() }] });

    let respuestaFinal = '';
    let iteraciones = 0;

    while (iteraciones < MAX_TOOL_ITERATIONS) {
      iteraciones += 1;

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: contents as any,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: GEMINI_TOOLS as any,
          maxOutputTokens: 1024
        }
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      const functionCalls = parts.filter((p: any) => p.functionCall);

      contents.push({ role: 'model', parts });

      if (functionCalls.length === 0) {
        respuestaFinal = parts
          .filter((p: any) => typeof p.text === 'string')
          .map((p: any) => p.text)
          .join('\n')
          .trim();
        break;
      }

      const functionResponseParts = await Promise.all(
        functionCalls.map(async (p: any) => {
          let resultado: any;
          try {
            resultado = await ejecutarHerramienta(p.functionCall.name, p.functionCall.args);
          } catch (err: any) {
            resultado = { error: `Error ejecutando ${p.functionCall.name}: ${err?.message || err}` };
          }
          return {
            functionResponse: {
              name: p.functionCall.name,
              response: resultado
            }
          };
        })
      );

      contents.push({ role: 'user', parts: functionResponseParts });
    }

    if (!respuestaFinal) {
      respuestaFinal =
        'No pude generar una respuesta completa con la información disponible. ¿Puedes reformular tu pregunta?';
    }

    res.status(200).json({ respuesta: respuestaFinal });
  } catch (error: any) {
    console.error('Error en chatConIA (Gemini):', error);
    res.status(500).json({
      message: 'Error al procesar la consulta con la IA.',
      error: error?.message || error
    });
  }
};