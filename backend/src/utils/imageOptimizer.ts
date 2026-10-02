// src/utils/imageOptimizer.ts
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Optimiza y comprime una imagen guardada en disco.
 * @param filePath Ruta absoluta del archivo subido por Multer.
 * @param quality Calidad de compresión (1-100), por defecto 80.
 * @param maxWidth Ancho máximo permitido (opcional, ajusta proporcionalmente).
 */
export const compressImage = async (
  filePath: string,
  quality: number = 80,
  maxWidth: number = 1920
): Promise<string> => {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const tempPath = path.join(dir, `compressed-${path.basename(filePath)}`);

  let pipeline = sharp(filePath).resize({
    width: maxWidth,
    withoutEnlargement: true // No agranda si la imagen es más pequeña
  });

  // Aplicar compresión según el formato
  if (ext === '.jpg' || ext === '.jpeg') {
    pipeline = pipeline.jpeg({ quality, mozjpeg: true });
  } else if (ext === '.png') {
    pipeline = pipeline.png({ quality, compressionLevel: 8 });
  } else if (ext === '.webp') {
    pipeline = pipeline.webp({ quality });
  } else if (ext === '.gif') {
    // Para GIF estándar de un solo frame o conversión ligera
    pipeline = pipeline.gif();
  }

  // Guardar en archivo temporal y luego reemplazar el original
  await pipeline.toFile(tempPath);
  
  // Reemplazar el archivo original con la versión comprimida
  fs.unlinkSync(filePath);
  fs.renameSync(tempPath, filePath);

  return filePath;
};