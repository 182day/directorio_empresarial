// src/middlewares/uploadExcelMiddleware.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Definir la ruta absoluta donde se guardarán temporalmente los archivos cargados
const uploadDir = path.resolve(process.cwd(), 'uploads');

// Crear la carpeta automáticamente si no existe para evitar errores ENOENT
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
        cb(null, `import-companies-${uniqueSuffix}${ext}`);
    }
});

export const uploadExcel = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // Límite de 50 MB
    },
    fileFilter: (_req, file, cb) => {
        const filetypes = /xlsx/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten archivos con extensión .xlsx'));
    }
});