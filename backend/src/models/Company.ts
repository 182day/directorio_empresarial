// src/models/Company.ts
import { Schema, model, Document } from 'mongoose';

export interface IContactoConCargo {
  nombreCompleto: string;
  cargo?: string;
  telefono?: string;
  celularWhatsapp?: string;
  correoElectronico?: string;
}

export interface IContactoDirector {
  nombreCompleto: string;
  telefono?: string;
  celularWhatsapp?: string;
  correoElectronico: string;
}

export interface IEspecialidadSector {
  lista: string[];
  otroEspecifique?: string;
}

export interface ICompany extends Document {
  correoElectronico: string;
  nombreComercial: string;
  razonSocial: string;
  rfc: string;
  tamanoEmpresa: string;
  anioInicio: number;
  sitioWeb?: string;
  etiquetas: string[];
  tipoOperaciones: string[];
  tipoSuministro: string[];
  ubicacion: {
    estado: string;
    municipio: string;
    direccion: string;
    colonia: string;
    codigoPostal: string;
    parqueIndustrial?: string;
  };
  contactos: {
    directorGeneral: IContactoDirector;
    compras?: IContactoConCargo;
    ventas?: IContactoConCargo;
    recursosHumanos?: IContactoConCargo;
  };
  informacionEmpresa: {
    productosFabrica: string;
    principalesClientes?: string;
    paisOrigen: string;
    paisOrigenOtro?: string;
    porcentajeInversionNacional: number;
    porcentajeInversionExtranjero: number;
    certificaciones: {
      lista: string[];
      otroEspecifique?: string;
    };
    sectoresPertenece: {
      lista: string[];
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
    principalSectorAtiende: string;
    porcentajeExportaciones: number;
    destinoExportaciones: string[];
  };
  retosActuales: string;
  apoyosYNecesidades: {
    tipos: string[];
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
    nombreCompleto: { type: String, required: true, trim: true },
    telefono: { type: String, default: '', trim: true },
    celularWhatsapp: { type: String, default: '', trim: true },
    correoElectronico: { type: String, required: true, trim: true, lowercase: true }
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
    correoElectronico: { type: String, required: true, trim: true, lowercase: true },
    nombreComercial: { type: String, required: true, trim: true },
    razonSocial: { type: String, required: true, trim: true },
    rfc: { type: String, required: true, unique: true, uppercase: true, trim: true },
    tamanoEmpresa: { type: String, required: true, enum: ['Micro', 'Pequeña', 'Mediana', 'Grande'] },
    anioInicio: { type: Number, required: true },
    sitioWeb: { type: String, trim: true, default: '' },
    etiquetas: [{ type: String, trim: true }],
    tipoSuministro: [{ type: String, required: true }],
    tipoOperaciones: [{ type: String, required: true }],
    ubicacion: {
      estado: { type: String, required: true },
      municipio: { type: String, required: true },
      direccion: { type: String, required: true, trim: true },
      colonia: { type: String, required: true, trim: true },
      codigoPostal: { type: String, required: true, trim: true },
      parqueIndustrial: { type: String, default: '', trim: true }
    },
    contactos: {
      directorGeneral: { type: ContactoDirectorSchema, required: true },
      compras: { type: ContactoConCargoSchema },
      ventas: { type: ContactoConCargoSchema },
      recursosHumanos: { type: ContactoConCargoSchema }
    },
    informacionEmpresa: {
      productosFabrica: { type: String, required: true, trim: true },
      principalesClientes: { type: String, default: '', trim: true },
      paisOrigen: { type: String, required: true, trim: true },
      paisOrigenOtro: { type: String, default: '', trim: true },
      porcentajeInversionNacional: { type: Number, required: true, min: 0, max: 100 },
      porcentajeInversionExtranjero: { type: Number, required: true, min: 0, max: 100 },
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
      principalSectorAtiende: { type: String, required: true, trim: true },
      porcentajeExportaciones: { type: Number, required: true, min: 0, max: 100 },
      destinoExportaciones: [{ type: String, trim: true }]
    },
    retosActuales: { type: String, required: true, trim: true },
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