// src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import companyRoutes from './routes/companyRoutes';
import userRoutes from './routes/userRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import aiRoutes from './routes/aiRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());

// Declaración de Rutas
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
  res.send('API del Directorio Empresarial funcionando correctamente.');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// import { GoogleGenAI } from '@google/genai';

// async function verificarModelos() {
//   try {
//     const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
//     const response = await ai.models.list();
//     console.log("--- MODELOS DISPONIBLES PARA TU API KEY ---");
//     for await (const model of response) {
//       console.log(model.name);
//     }
//     console.log("-------------------------------------------");
//   } catch (error) {
//     console.error("Error al listar modelos:", error);
//   }
// }

// // Llama a la función para ver el resultado en la consola al iniciar el backend
// verificarModelos();