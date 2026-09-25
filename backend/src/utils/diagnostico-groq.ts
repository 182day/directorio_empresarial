// diagnostico-groq.ts
//
// Script aislado para confirmar qué modelos ve tu API key de Groq,
// sin pasar por tu app de Express (para descartar cualquier otra causa).
//
// Cómo correrlo desde la carpeta backend/:
//   npx tsx diagnostico-groq.ts
//
// (si no tienes tsx: npm install -g tsx, o usa ts-node)
// npx tsx src/utils/diagnostico-groq.ts

import 'dotenv/config';
import Groq from 'groq-sdk';

async function main() {
  const apiKey = process.env.GROQ_API_KEY;

  console.log('--- Diagnóstico Groq ---');
  console.log('¿GROQ_API_KEY está definida?', apiKey ? 'Sí' : 'NO ❌');
  if (apiKey) {
    console.log('Primeros caracteres:', apiKey.slice(0, 8) + '...');
    console.log('Longitud total:', apiKey.length);
  }

  if (!apiKey) {
    console.log('No hay API key que probar. Revisa tu .env');
    return;
  }

  const groq = new Groq({ apiKey });

  try {
    const modelos = await groq.models.list();
    console.log('\n✅ Conexión exitosa. Modelos disponibles para esta key:\n');
    (modelos.data || []).forEach((m: any) => console.log('-', m.id));
  } catch (err: any) {
    console.log('\n❌ Error al listar modelos:');
    console.log(err?.status, err?.message);
    console.log(err?.error || err);
  }
}

main();