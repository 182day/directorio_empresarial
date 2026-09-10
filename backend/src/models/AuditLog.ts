// src/models/AuditLog.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  accion: string;
  modulo: string;
  empresaId?: Types.ObjectId; // 👈 Ahora es opcional
  usuarioId: Types.ObjectId;
  detalles: any;
  ip?: string; // 👈 Campo de IP
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    accion: { type: String, required: true },
    modulo: { type: String, required: true, default: 'General' },
    empresaId: { type: Schema.Types.ObjectId, required: false, ref: 'Company' }, // 👈 required: false
    usuarioId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    detalles: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' }, // 👈 Guardar IP
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'bitacoras'
  }
);

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);