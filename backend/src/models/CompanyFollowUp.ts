// src/models/CompanyFollowUP.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface ICompanyFollowUp extends Document {
  empresaId: Types.ObjectId;
  usuarioId?: Types.ObjectId;
  fechaSeguimiento: string;
  horaSeguimiento: string;
  tipoSeguimiento: string;
  medioAtencion: string;
  asunto: string;
  descripcion: string;
  atencionSeguimiento?: string;
  estatus: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanyFollowUpSchema = new Schema<ICompanyFollowUp>(
  {
    empresaId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    usuarioId: { type: Schema.Types.ObjectId, ref: 'User' },
    fechaSeguimiento: { type: String, required: true },
    horaSeguimiento: { type: String, required: true },
    tipoSeguimiento: { type: String, required: true },
    medioAtencion: { type: String, required: true },
    asunto: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true, trim: true },
    atencionSeguimiento: { type: String, default: '', trim: true },
    estatus: { type: String, default: 'En Proceso' }
  },
  {
    timestamps: true
  }
);

export const CompanyFollowUp = model<ICompanyFollowUp>('CompanyFollowUp', CompanyFollowUpSchema);