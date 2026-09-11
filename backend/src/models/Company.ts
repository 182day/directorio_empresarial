// src/models/Company.ts
import { Schema, model, Document } from 'mongoose';

// Interface reutilizable para los contactos que llevan cargo
export interface IContactoConCargo {
  nombreCompleto: string;
  cargo: string;
  telefono: string;
  celularWhatsapp: string;
  correoElectronico: string;
}

// Interface para el Director General (sin cargo)
export interface IContactoDirector {
  nombreCompleto: string;
  telefono: string;
  celularWhatsapp: string;
  correoElectronico: string;
}

// Interface para las especialidades/subsectores de cada sector
export interface IEspecialidadSector {
  opciones: string[];
  otroEspecifique?: string;
}

// 1. Interfaz de TypeScript para el autocompletado y tipado estricto
export interface ICompany extends Document {
  correoElectronico: string;
  nombreComercial: string;
  razonSocial: string;
  rfc: string;
  tamanoEmpresa: string;
  anioInicio: number;
  sitioWeb?: string;
  etiquetas: string[];
  tipoOperaciones: ('Fabricante' | 'Distribuidor' | 'Servicios')[];
  tipoSuministro: ('Directo' | 'Indirecto')[];
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
    compras: IContactoConCargo;
    ventas: IContactoConCargo;
    recursosHumanos: IContactoConCargo;
  };
  informacionEmpresa: {
    productosFabrica: string;
    principalesClientes: string;
    paisOrigen: string;
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
    especialidadesSectores?: {
      plasticos?: IEspecialidadSector;
      metalmecanico?: IEspecialidadSector;
      electricoElectronico?: IEspecialidadSector;
      empaque?: IEspecialidadSector;
      tecnologiasInformacion?: IEspecialidadSector;
      textil?: IEspecialidadSector;
      serviciosEspecializados?: IEspecialidadSector;
      mros?: IEspecialidadSector;
      minero?: IEspecialidadSector;
    };
    principalSectorAtiende: string;
    porcentajeExportaciones: number;
    destinoExportaciones: string[];
  };
  // NUEVO: Retos y Apoyos / Necesidades
  retosActuales: string; // Obligatorio (*)
  apoyosYNecesidades: {
    tipos: string[]; // Checkbox obligatorio (*)
    otroEspecifique?: string;
  };
  presentacionComercial: string;
  activa: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Sub-esquemas reutilizables para Mongoose
const ContactoConCargoSchema = new Schema<IContactoConCargo>(
  {
    nombreCompleto: { type: String, required: true, trim: true },
    cargo: { type: String, required: true, trim: true },
    telefono: { type: String, required: true, trim: true },
    celularWhatsapp: { type: String, required: true, trim: true },
    correoElectronico: { type: String, required: true, trim: true, lowercase: true }
  },
  { _id: false }
);

const ContactoDirectorSchema = new Schema<IContactoDirector>(
  {
    nombreCompleto: { type: String, required: true, trim: true },
    telefono: { type: String, required: true, trim: true },
    celularWhatsapp: { type: String, required: true, trim: true },
    correoElectronico: { type: String, required: true, trim: true, lowercase: true }
  },
  { _id: false }
);

const EspecialidadSectorSchema = new Schema<IEspecialidadSector>(
  {
    opciones: [{ type: String, trim: true }],
    otroEspecifique: { type: String, default: '', trim: true }
  },
  { _id: false }
);

// 2. Esquema de Mongoose
const CompanySchema = new Schema<ICompany>(
  {
    correoElectronico: { type: String, required: true, trim: true, lowercase: true },
    nombreComercial: { type: String, required: true, trim: true },
    razonSocial: { type: String, required: true, trim: true },
    rfc: { type: String, required: true, unique: true, uppercase: true, trim: true },
    tamanoEmpresa: { type: String, required: true, enum: ['Micro', 'Pequeña', 'Mediana', 'Grande'] },
    anioInicio: { type: Number, required: true },
    sitioWeb: { type: String, trim: true, default: '' },
    etiquetas: [{ type: String, required: true, trim: true }], 
    tipoSuministro: [{ type: String, required: true, enum: ['Directo', 'Indirecto'] }],
    tipoOperaciones: [{ type: String, required: true, enum: ['Fabricante', 'Distribuidor', 'Servicios'] }],
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
      compras: { type: ContactoConCargoSchema, required: true },
      ventas: { type: ContactoConCargoSchema, required: true },
      recursosHumanos: { type: ContactoConCargoSchema, required: true }
    },
    informacionEmpresa: {
      productosFabrica: { type: String, required: true, trim: true },
      principalesClientes: { type: String, required: true, trim: true },
      paisOrigen: { type: String, required: true, trim: true },
      porcentajeInversionNacional: { type: Number, required: true, min: 0, max: 100 },
      porcentajeInversionExtranjero: { type: Number, required: true, min: 0, max: 100 },
      certificaciones: {
        lista: [{ type: String, trim: true }],
        otroEspecifique: { type: String, default: '', trim: true }
      },
      sectoresPertenece: {
        lista: {
          type: [{ type: String, trim: true }],
          required: true,
          validate: {
            validator: function (v: string[]) {
              return v && v.length > 0;
            },
            message: 'Debe seleccionar al menos un sector al que pertenece.'
          }
        },
        otroEspecifique: { type: String, default: '', trim: true }
      },
      especialidadesSectores: {
        plasticos: { type: EspecialidadSectorSchema },
        metalmecanico: { type: EspecialidadSectorSchema },
        electricoElectronico: { type: EspecialidadSectorSchema },
        empaque: { type: EspecialidadSectorSchema },
        tecnologiasInformacion: { type: EspecialidadSectorSchema },
        textil: { type: EspecialidadSectorSchema },
        serviciosEspecializados: { type: EspecialidadSectorSchema },
        mros: { type: EspecialidadSectorSchema },
        minero: { type: EspecialidadSectorSchema }
      },
      principalSectorAtiende: { type: String, required: true, trim: true },
      porcentajeExportaciones: { type: Number, required: true, min: 0, max: 100 },
      destinoExportaciones: [{ type: String, trim: true }]
    },

    // NUEVO: Retos y Apoyos / Necesidades
    retosActuales: { type: String, required: true, trim: true },
    apoyosYNecesidades: {
      tipos: {
        type: [{ type: String, trim: true }],
        required: true,
        validate: {
          validator: function (v: string[]) {
            return v && v.length > 0;
          },
          message: 'Debe seleccionar al menos un tipo de apoyo o necesidad.'
        }
      },
      otroEspecifique: { type: String, default: '', trim: true }
    },

    presentacionComercial: { type: String, required: true, trim: true },
    activa: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

export const Company = model<ICompany>('Company', CompanySchema);