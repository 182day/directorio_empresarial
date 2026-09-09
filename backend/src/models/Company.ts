import { Schema, model, Document } from 'mongoose';

// 1. Interfaz de TypeScript para el autocompletado y tipado estricto
export interface ICompany extends Document {
  nombreComercial: string;
  razonSocial: string;
  rfc: string;
  tamanoEmpresa: string;
  anioInicio: number;
  sitioWeb?: string;
  tipoOperaciones: string[];
  tipoSuministro: ('Directo' | 'Indirecto')[];
  ubicacion: {
    estado: string;
    municipio: string;
    direccion?: string;
    colonia?: string;
    codigoPostal?: string;
    parqueIndustrial?: string;
  };
  activa: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Esquema de Mongoose
const CompanySchema = new Schema<ICompany>(
  {
    nombreComercial: { type: String, required: true, trim: true },
    razonSocial: { type: String, required: true, trim: true },
    rfc: { type: String, required: true, unique: true, uppercase: true, trim: true },
    tamanoEmpresa: { type: String, required: true },
    anioInicio: { type: Number, required: true },
    sitioWeb: { type: String, trim: true, default: '' },
    tipoOperaciones: [{ type: String, trim: true }],
    tipoSuministro: [{ type: String, enum: ['Directo', 'Indirecto'] }],
    ubicacion: {
      estado: { type: String, required: true },
      municipio: { type: String, required: true },
      direccion: { type: String, default: '' },
      colonia: { type: String, default: '' },
      codigoPostal: { type: String, default: '' },
      parqueIndustrial: { type: String, default: '' }
    },
    activa: { type: Boolean, default: false } // 👈 Por defecto inactiva para registros públicos
  },
  {
    timestamps: true // Agrega campos automáticos createdAt y updatedAt
  }
);

export const Company = model<ICompany>('Company', CompanySchema);