import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Asegurar que la carpeta exista
const uploadDir = path.join(__dirname, '../assets/empresas');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

export const uploadDocument = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Límite de 10MB
});