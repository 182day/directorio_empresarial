// src/models/Company.ts
import { Schema, model, Document } from 'mongoose';

export interface IContactoConCargo {
  nombreCompleto?: string;
  cargo?: string;
  telefono?: string;
  celularWhatsapp?: string;
  correoElectronico?: string;
}

export interface IContactoDirector {
  nombreCompleto?: string;
  telefono?: string;
  celularWhatsapp?: string;
  correoElectronico?: string;
}

export interface IEspecialidadSector {
  lista?: string[];
  otroEspecifique?: string;
}

export interface ICompany extends Document {
  tipoEmpresa?: string; // e.g., 'Empresa directorio' o 'Empresa incompleta'
  correoElectronico?: string;
  nombreComercial: string; // 👈 OBLIGATORIO
  razonSocial?: string;
  rfc: string;             // 👈 OBLIGATORIO
  tamanoEmpresa?: string;
  anioInicio?: number;
  sitioWeb?: string;
  etiquetas: string[];
  tipoOperaciones: string[];
  tipoSuministro: string[];
  ubicacion: {
    estado?: string;
    municipio?: string;
    direccion?: string;
    colonia?: string;
    codigoPostal?: string;
    parqueIndustrial?: string;
    latitud?: number;
    longitud?: number;
  };
  contactos: {
    directorGeneral?: IContactoDirector;
    compras?: IContactoConCargo;
    ventas?: IContactoConCargo;
    recursosHumanos?: IContactoConCargo;
  };
  informacionEmpresa: {
    productosFabrica?: string;
    principalesClientes?: string;
    paisOrigen?: string;
    paisOrigenOtro?: string;
    porcentajeInversionNacional?: number;
    porcentajeInversionExtranjero?: number;
    certificaciones?: {
      lista?: string[];
      otroEspecifique?: string;
    };
    sectoresPertenece?: {
      lista?: string[];
      otroEspecifique?: string;
    };
    sectorPlasticos?: IEspecialidadSector;
    sectorMetalmecanico?: IEspecialidadSector;
    sectorElectricaElectronica?: IEspecialidadSector;
    sectorEmpaque?: IEspecialidadSector;
    sectorTiI40?: IEspecialidadSector;
    sectorTextil?: IEspecialidadSector;
    sectorServiciosEspecializados?: IEspecialidadSector;
    sectorMros?: IEspecialidadSector;
    sectorMinero?: IEspecialidadSector;
    principalSectorAtiende?: string;
    porcentajeExportaciones?: number;
    destinoExportaciones?: string[];
  };
  retosActuales?: string;
  apoyosYNecesidades?: {
    tipos?: string[];
    otroEspecifique?: string;
  };
  presentacionComercial?: string;
  activa: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContactoConCargoSchema = new Schema<IContactoConCargo>(
  {
    nombreCompleto: { type: String, default: '', trim: true },
    cargo: { type: String, default: '', trim: true },
    telefono: { type: String, default: '', trim: true },
    celularWhatsapp: { type: String, default: '', trim: true },
    correoElectronico: { type: String, default: '', trim: true, lowercase: true }
  },
  { _id: false }
);

const ContactoDirectorSchema = new Schema<IContactoDirector>(
  {
    nombreCompleto: { type: String, default: '', trim: true },
    telefono: { type: String, default: '', trim: true },
    celularWhatsapp: { type: String, default: '', trim: true },
    correoElectronico: { type: String, default: '', trim: true, lowercase: true }
  },
  { _id: false }
);

const EspecialidadSectorSchema = new Schema<IEspecialidadSector>(
  {
    lista: [{ type: String, trim: true }],
    otroEspecifique: { type: String, default: '', trim: true }
  },
  { _id: false }
);

const CompanySchema = new Schema<ICompany>(
  {
    tipoEmpresa: { type: String, default: 'Empresa directorio', trim: true },
    correoElectronico: { type: String, default: '', trim: true, lowercase: true },
    
    // --- CAMPOS OBLIGATORIOS A NIVEL BASE DE DATOS ---
    nombreComercial: { type: String, required: true, trim: true },
    rfc: { type: String, required: true, unique: true, uppercase: true, trim: true },

    // --- CAMPOS OPCIONALES / FLEXIBLES ---
    razonSocial: { type: String, default: '', trim: true },
    tamanoEmpresa: { type: String, default: '', enum: ['', 'Micro', 'Pequeña', 'Mediana', 'Grande'] },
    anioInicio: { type: Number },
    sitioWeb: { type: String, trim: true, default: '' },
    etiquetas: [{ type: String, trim: true }],
    tipoSuministro: [{ type: String }],
    tipoOperaciones: [{ type: String }],
    ubicacion: {
      estado: { type: String, default: '', trim: true },
      municipio: { type: String, default: '', trim: true },
      direccion: { type: String, default: '', trim: true },
      colonia: { type: String, default: '', trim: true },
      codigoPostal: { type: String, default: '', trim: true },
      parqueIndustrial: { type: String, default: '', trim: true },
      latitud: { type: Number, min: -90, max: 90 },
      longitud: { type: Number, min: -180, max: 180 }
    },
    contactos: {
      directorGeneral: { type: ContactoDirectorSchema, default: {} },
      compras: { type: ContactoConCargoSchema, default: {} },
      ventas: { type: ContactoConCargoSchema, default: {} },
      recursosHumanos: { type: ContactoConCargoSchema, default: {} }
    },
    informacionEmpresa: {
      productosFabrica: { type: String, default: '', trim: true },
      principalesClientes: { type: String, default: '', trim: true },
      paisOrigen: { type: String, default: '', trim: true },
      paisOrigenOtro: { type: String, default: '', trim: true },
      porcentajeInversionNacional: { type: Number, default: 0, min: 0, max: 100 },
      porcentajeInversionExtranjero: { type: Number, default: 0, min: 0, max: 100 },
      certificaciones: {
        lista: [{ type: String, trim: true }],
        otroEspecifique: { type: String, default: '', trim: true }
      },
      sectoresPertenece: {
        lista: [{ type: String, trim: true }],
        otroEspecifique: { type: String, default: '', trim: true }
      },
      sectorPlasticos: { type: EspecialidadSectorSchema },
      sectorMetalmecanico: { type: EspecialidadSectorSchema },
      sectorElectricaElectronica: { type: EspecialidadSectorSchema },
      sectorEmpaque: { type: EspecialidadSectorSchema },
      sectorTiI40: { type: EspecialidadSectorSchema },
      sectorTextil: { type: EspecialidadSectorSchema },
      sectorServiciosEspecializados: { type: EspecialidadSectorSchema },
      sectorMros: { type: EspecialidadSectorSchema },
      sectorMinero: { type: EspecialidadSectorSchema },
      principalSectorAtiende: { type: String, default: '', trim: true },
      porcentajeExportaciones: { type: Number, default: 0, min: 0, max: 100 },
      destinoExportaciones: [{ type: String, trim: true }]
    },
    retosActuales: { type: String, default: '', trim: true },
    apoyosYNecesidades: {
      tipos: [{ type: String, trim: true }],
      otroEspecifique: { type: String, default: '', trim: true }
    },
    presentacionComercial: { type: String, default: '', trim: true },
    activa: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

export const Company = model<ICompany>('Company', CompanySchema);