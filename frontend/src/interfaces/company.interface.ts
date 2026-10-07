// src/interfaces/company.interface.ts

export type TamanoEmpresa = '' | 'Micro' | 'Pequeña' | 'Mediana' | 'Grande';
export type TipoEmpresa = 'Empresa directorio' | 'Empresa incompleta';

// Interfaz para los documentos adjuntos
export interface CompanyDocument {
  _id?: string;
  titulo: string;
  tipoDocumento: string;
  descripcion?: string;
  nombreArchivo?: string;
  tamano?: number;
  fechaSubida?: string | Date;
}

// 1. Interfaz Completa (Usada principalmente en CompanyForm)
export interface CompanyFormData {
  _id?: string;
  createdAt?: string | Date;
  tipoEmpresa?: TipoEmpresa;
  correoElectronico: string;
  nombreComercial: string;
  razonSocial: string;
  rfc: string;
  tamanoEmpresa: TamanoEmpresa;
  anioInicio: number;
  sitioWeb: string;
  etiquetas: string[];
  tipoOperaciones: string[];
  tipoSuministro: string[];
  documentos?: CompanyDocument[];
  ubicacion: {
    estado: string;
    municipio: string;
    direccion: string;
    colonia: string;
    codigoPostal: string;
    parqueIndustrial?: string;
    latitud?: number | '';
    longitud?: number | '';
  };
  contactos: {
    directorGeneral: {
      nombreCompleto: string;
      telefono: string;
      celularWhatsapp: string;
      correoElectronico: string;
    };
    compras: {
      nombreCompleto: string;
      cargo: string;
      telefono: string;
      celularWhatsapp: string;
      correoElectronico: string;
    };
    ventas: {
      nombreCompleto: string;
      cargo: string;
      telefono: string;
      celularWhatsapp: string;
      correoElectronico: string;
    };
    recursosHumanos: {
      nombreCompleto: string;
      cargo: string;
      telefono: string;
      celularWhatsapp: string;
      correoElectronico: string;
    };
  };
  informacionEmpresa: {
    productosFabrica: string;
    principalesClientes: string;
    paisOrigen: string;
    paisOrigenOtro?: string;
    porcentajeInversionNacional: number | '';
    porcentajeInversionExtranjero: number | '';
    certificaciones: {
      lista: string[];
      otroEspecifique?: string;
    };
    sectoresPertenece: {
      lista: string[];
      otroEspecifique?: string;
    };
    sectorPlasticos: {
      lista: string[];
      otroEspecifique?: string;
    };
    sectorMetalmecanico: {
      lista: string[];
      otroEspecifique?: string;
    };
    sectorElectricaElectronica: {
      lista: string[];
      otroEspecifique?: string;
    };
    sectorEmpaque: {
      lista: string[];
      otroEspecifique?: string;
    };
    sectorTiI40: {
      lista: string[];
      otroEspecifique?: string;
    };
    sectorTextil: {
      lista: string[];
      otroEspecifique?: string;
    };
    sectorServiciosEspecializados: {
      lista: string[];
      otroEspecifique?: string;
    };
    sectorMros: {
      lista: string[];
      otroEspecifique?: string;
    };
    sectorMinero: {
      lista: string[];
      otroEspecifique?: string;
    };
    principalSectorAtiende: string;
    principalSectorAtiendeOtro: string;
    porcentajeExportaciones: number | '';
    destinoExportaciones: string[];
  };
  retosActuales: string;
  apoyosYNecesidades: {
    tipos: string[];
    otroEspecifique?: string;
  };
  presentacionComercial: string;
  activa?: boolean;
}

// 2. Interfaz Reducida (Usada en Directory.tsx y listados simples)
export interface DirectoryCompany {
  _id: string;
  tipoEmpresa?: TipoEmpresa;
  tamanoEmpresa?: string;
  tamanio?: string;
  tipoOperaciones: string[];
  ubicacion: {
    estado: string;
    municipio: string;
  };
  activa: boolean;
  tipoSuministro?: string[];
  informacionEmpresa?: {
    paisOrigen?: string;
    destinoExportaciones?: string[];
    sectoresPertenece?: {
      lista?: string[];
      otroEspecifique?: string;
    };
    certificaciones?: {
      lista?: string[];
      otroEspecifique?: string;
    };
  };
}

export type CompanySortField = 
  | 'createdAt'
  | 'nombreComercial'
  | 'razonSocial'
  | 'rfc'
  | 'tamanoEmpresa'
  | 'tipoEmpresa'
  | 'anioInicio'
  | 'estado'
  | 'municipio'
  | 'paisOrigen'
  | 'activa';

export type SortOrder = 'asc' | 'desc';