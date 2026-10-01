import { Router } from 'express';
import {
  getCompanies,
  getCompanyById,
  createCompany,
  createPublicCompany,
  updateCompany,
  deleteCompany,
  createCompanyFollowUp,
  getCompanyFollowUps,
  getFollowUpCompanies,
  getFollowUpUsers,
  updateCompanyFollowUp,
  deleteCompanyFollowUp,
  uploadCompanyDocument,
  getCompanyDocument,
  deleteCompanyDocument
} from '../controllers/companyController';
import { protect, optionalAuth, checkRole } from '../middlewares/authMiddleware';
import { uploadDocument } from '../middlewares/uploadMiddleware';
import { validatePublicCompany } from '../middlewares/validators/companyValidator';
import { validateCompanyFollowUp } from '../middlewares/validators/followValidator';

const router = Router();

// 1. Rutas Públicas de Empresas
router.get('/', optionalAuth, getCompanies);
router.post('/public', validatePublicCompany, createPublicCompany);

// 2. Rutas de Seguimientos (requieren autenticación)
router.post('/follows', protect, checkRole(['admin', 'editor']), validateCompanyFollowUp, createCompanyFollowUp);
router.get('/follows', protect, checkRole(['admin', 'editor', 'lector']), getCompanyFollowUps);
router.get('/follows/filter-companies', protect, checkRole(['admin', 'editor', 'lector']), getFollowUpCompanies);
router.get('/follows/filter-users', protect, checkRole(['admin', 'editor', 'lector']), getFollowUpUsers);

router.put('/follows/:id', protect, checkRole(['admin', 'editor']), validateCompanyFollowUp, updateCompanyFollowUp);
router.delete('/follows/:id', protect, checkRole(['admin', 'editor']), deleteCompanyFollowUp);
router.get('/follows/:companyId', protect, checkRole(['admin', 'editor', 'lector']), getCompanyFollowUps);

// 3. Rutas de Documentos
// Visualizar documento protegido por nombre de archivo
router.get(
  '/documents/file/:filename',
  protect,
  checkRole(['admin', 'editor', 'lector']),
  getCompanyDocument
);

// Adjuntar nuevo documento
router.post(
  '/:id/documents',
  protect,
  checkRole(['admin', 'editor']),
  uploadDocument.single('archivo'),
  uploadCompanyDocument
);

// Eliminar documento por ID de empresa y ID de documento
router.delete(
  '/:id/documents/:docId',
  protect,
  checkRole(['admin', 'editor']),
  deleteCompanyDocument
);

// 4. Rutas Paramétricas y Protegidas de Empresas
router.get('/:id', getCompanyById);
router.post('/', protect, checkRole(['admin', 'editor']), validatePublicCompany, createCompany);
router.put('/:id', protect, checkRole(['admin', 'editor']), validatePublicCompany, updateCompany);
router.delete('/:id', protect, checkRole(['admin', 'editor']), deleteCompany);

export default router;