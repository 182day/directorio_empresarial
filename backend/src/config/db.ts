// src/config/db.ts
import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || '');
    // const conn = await mongoose.connect(process.env.MONGODB_URI || '', {
    //   serverSelectionTimeoutMS: 15000, // Espera hasta 15 segundos a que responda el DNS lento
    //   socketTimeoutMS: 45000,          // Evita que se corte la conexión por microcortes de internet
    // });
    console.log(`MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error al conectar a MongoDB: ${error}`);
    process.exit(1);
  }
};