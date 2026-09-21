// src/models/CompanyFollowUp.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IOtraEmpresa {
  nombreEmpresa: string;
  rfc?: string;
  estado?: string;
  municipio?: string;
  nombreContacto?: string;
  telefonoContacto?: string;
  correoElectronico?: string;
}

export interface ICompanyFollowUp extends Document {
  empresaId?: Types.ObjectId | null; // 👈 Ahora puede ser nulo si es 'OTRA'
  usuarioId?: Types.ObjectId;
  fechaSeguimiento: string;
  horaSeguimiento: string;
  tipoSeguimiento: string;
  medioAtencion: string;
  asunto: string;
  descripcion: string;
  atencionSeguimiento?: string;
  estatus: string;
  empresasVinculadas?: Types.ObjectId[];
  otraEmpresa?: IOtraEmpresa; // 👈 Interfaz añadida
  createdAt: Date;
  updatedAt: Date;
}

const OtraEmpresaSchema = new Schema<IOtraEmpresa>(
  {
    nombreEmpresa: { type: String, required: true, trim: true },
    rfc: { type: String, default: '', trim: true },
    estado: { type: String, default: '', trim: true },
    municipio: { type: String, default: '', trim: true },
    nombreContacto: { type: String, default: '', trim: true },
    telefonoContacto: { type: String, default: '', trim: true },
    correoElectronico: { type: String, default: '', trim: true, lowercase: true }
  },
  { _id: false }
);

const CompanyFollowUpSchema = new Schema<ICompanyFollowUp>(
  {
    // 👈 ya no es required strict para soportar registros manuales
    empresaId: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
    usuarioId: { type: Schema.Types.ObjectId, ref: 'User' },
    fechaSeguimiento: { type: String, required: true },
    horaSeguimiento: { type: String, required: true },
    tipoSeguimiento: { type: String, required: true },
    medioAtencion: { type: String, required: true },
    asunto: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true, trim: true },
    atencionSeguimiento: { type: String, default: '', trim: true },
    estatus: { type: String, default: 'En Proceso' },
    empresasVinculadas: [{ type: Schema.Types.ObjectId, ref: 'Company' }],
    otraEmpresa: { type: OtraEmpresaSchema, default: undefined } // 👈 Schema embebido
  },
  {
    timestamps: true
  }
);

export const CompanyFollowUp = model<ICompanyFollowUp>('CompanyFollowUp', CompanyFollowUpSchema);