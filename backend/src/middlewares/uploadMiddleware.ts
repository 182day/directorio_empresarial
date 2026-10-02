// src/middlewares/uploadMiddleware.ts
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

// Extensiones y mimetypes permitidos para imágenes (Logotipo / Fotografía)
const ALLOWED_IMAGE_EXT = /jpg|jpeg|png|gif/;
const ALLOWED_IMAGE_MIME = /image\/(jpeg|jpg|png|gif)/;

// Extensiones y mimetypes permitidos para documentos generales
const ALLOWED_ALL_EXT = /pdf|jpg|jpeg|png|xlsx|xls|csv|gif|doc|docx|ppt|pptx/;

const ALLOWED_ALL_MIME = /image\/(jpeg|jpg|png|gif)|application\/pdf|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|application\/vnd\.ms-excel|text\/csv|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/vnd\.ms-powerpoint|application\/vnd\.openxmlformats-officedocument\.presentationml\.presentation/;

export const uploadDocument = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // Límite de 15MB
  fileFilter: (req, file, cb) => {
    const tipoDocumento = req.body?.tipoDocumento;
    const isImageOnly = tipoDocumento === 'Logotipo' || tipoDocumento === 'Fotografía';

    const extName = path.extname(file.originalname).toLowerCase().replace('.', '');
    const mimeType = file.mimetype.toLowerCase();

    if (isImageOnly) {
      const validExt = ALLOWED_IMAGE_EXT.test(extName);
      const validMime = ALLOWED_IMAGE_MIME.test(mimeType);

      if (validExt && validMime) {
        return cb(null, true);
      }
      return cb(new Error(`Para ${tipoDocumento} solo se permiten archivos JPG, JPEG, PNG o GIF.`));
    } else {
      const validExt = ALLOWED_ALL_EXT.test(extName);
      const validMime = ALLOWED_ALL_MIME.test(mimeType);

      if (validExt && validMime) {
        return cb(null, true);
      }
      return cb(new Error('Formato de archivo no permitido. Tipos válidos: PDF, JPG, JPEG, PNG, GIF, XLSX, XLS, CSV, DOC, DOCX, PPT, PPTX.'));
    }
  }
});