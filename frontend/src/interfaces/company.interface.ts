// src/interfaces/company.interface.ts

// 1. Interfaz Completa (Usada principalmente en CompanyForm)
export interface CompanyFormData {
  _id?: string;
  correoElectronico: string;
  nombreComercial: string;
  razonSocial: string;
  rfc: string;
  tamanoEmpresa: string;
  anioInicio: number;
  sitioWeb: string;
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
  nombreComercial: string;
  razonSocial: string;
  rfc: string;
  tamanoEmpresa?: string;
  tamanio?: string; // Para compatibilidad si el backend devuelve tamanio
  anioInicio: number;
  sitioWeb?: string;
  tipoOperaciones: string[];
  ubicacion: {
    estado: string;
    municipio: string;
  };
  activa: boolean;
}