// src/models/AuditLog.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  accion: string;
  modulo: string;
  empresaId?: Types.ObjectId | null; // 👈 Acepta ObjectId, null o undefined
  usuarioId?: Types.ObjectId | null; // 👈 Acepta ObjectId, null o undefined (Permite logins fallidos de usuarios inexistentes)
  detalles: any;
  ip?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    accion: { type: String, required: true },
    modulo: { type: String, required: true, default: 'General' },
    empresaId: { type: Schema.Types.ObjectId, required: false, default: null, ref: 'Company' },
    usuarioId: { type: Schema.Types.ObjectId, required: false, default: null, ref: 'User' }, // 👈 required: false
    detalles: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'bitacoras'
  }
);

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);