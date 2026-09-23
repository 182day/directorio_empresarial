// src/data/companyCatalog.ts
import { type CompanySortField } from '../interfaces/company.interface';

export const OPCIONES_TAMANO = ['Micro', 'Pequeña', 'Mediana', 'Grande'];

// Opciones de ordenamiento centralizadas
export const SORT_OPTIONS: { label: string; value: CompanySortField }[] = [
  { label: 'Fecha de Registro', value: 'createdAt' },
  { label: 'Nombre Comercial', value: 'nombreComercial' },
  { label: 'Razón Social', value: 'razonSocial' },
  { label: 'RFC', value: 'rfc' },
  { label: 'Tamaño de Empresa', value: 'tamanoEmpresa' },
  { label: 'Año de Inicio', value: 'anioInicio' },
  { label: 'Estado', value: 'estado' },
  { label: 'Municipio', value: 'municipio' },
  { label: 'País de Origen', value: 'paisOrigen' },
  { label: 'Estatus (Activa)', value: 'activa' },
];

export const OPCIONES_OPERACIONES = ['Fabricante', 'Distribuidor', 'Servicios'];
export const OPCIONES_SUMINISTRO = ['Directo', 'Indirecto'];

// --- SECTOR CERTIFICACIONES ---
export const OPCIONES_CERTIFICACIONES = [
    'ISO 9001',
    'ISO 14001',
    'IATF 16949',
    'AS 9100',
    'OHSAS 18001',
    'ISO/IEC 17025',
    'Otro especifique'
];

// --- SECTORES GENERALES ---
export const RAW_SECTORES = [
    'Aeroespacial',
    'Hospitalario',
    'Servicios',
    'TI e I4.0',
    'Centro de investigación',
    'Alimentos',
    'Automotriz',
    'Academia',
    'Energético',
    'Plásticos',
    'Metalmecánico',
    'Biotecnología',
    'Eléctrica-Electrónica',
    'Logística',
    'Comercio',
    'Empaque',
    'Textil',
    'Minero'
];

export const OPCIONES_SECTORES = [
    ...RAW_SECTORES.sort((a, b) => a.localeCompare(b, 'es')),
    'Otro especifica'
];

// --- SECTOR PLÁSTICOS ---
export const RAW_PLASTICOS = [
    'Aplicación de pintura en piezas plásticas',
    'Mangueras y otros materiales extruidos',
    'Materias primas y aditivos',
    'Materiales Compuestos',
    'Películas plásticas (flexibles y rígidas)',
    'Piezas de fibra de carbón',
    'Piezas de fibra de vidrio',
    'Piezas de foam (no usadas para empaque)',
    'Piezas de hule',
    'Piezas de otros materiales compuestos',
    'Piezas fabricadas bajo moldeo por soplado',
    'Piezas fabricadas por rotomoldeo',
    'Piezas moldeadas (inyección de plástico)',
    'Plásticos relacionados a tapicería y trimings',
    'Recubrimientos plásticos sobre otros materiales (madera, metal, textiles)',
    'Recubrimientos y acabados metálicos',
    'Termoformados'
];

export const OPCIONES_SECTOR_PLASTICOS = [
    ...RAW_PLASTICOS.sort((a, b) => a.localeCompare(b, 'es')),
    'Otro especifica'
];

// --- SECTOR METALMECÁNICO ---
export const RAW_METALMECANICO = [
    'Fabricación de piezas maquinadas para producción (no refacciones)',
    'Fabricación de piezas troqueladas/estampadas',
    'Fabricación de piezas por fine blanking',
    'Fabricación de piezas roladas',
    'Fabricación de piezas fundidas por die casting',
    'Fabricación de piezas fundidas por sand casting',
    'Fabricación de piezas fundidas por molde permanente y semi permanente',
    'Fabricación de piezas fundidas por investment casting',
    'Fabricación de piezas sinterizadas',
    'Fabricación de piezas forja fría',
    'Fabricación de piezas forja caliente',
    'Fabricación de piezas forja tibia',
    'Fabricación y mantenimiento de dados, moldes y troqueles',
    'Fabricación de pailería ligera (sheet metal)',
    'Tratamiento térmico de metales',
    'Materias primas metálicas y accesorios',
    'Fabricación/distribución de tornillería',
    'Formas de alambre (resortes)',
    'Recubrimientos y acabados (galvanoplastia)',
    'Recubrimientos y acabados (pintura en polvo)',
    'Recubrimientos y acabados (pintura liquida)',
    'Habilitación de metales por corte (chorro de agua, laser, oxicorte, etc)',
    'Manufactura Avanzada'
];

export const OPCIONES_SECTOR_METALMECANICO = [
    ...RAW_METALMECANICO.sort((a, b) => a.localeCompare(b, 'es')),
    'Otro especifica'
];

// --- SECTOR ELÉCTRICA-ELECTRÓNICA ---
export const RAW_ELECTRICA_ELECTRONICA = [
    'Componentes pasivos',
    'Componentes activos',
    'Instrumentación de control',
    'Fibra óptica',
    'Componentes electromecánicos',
    'Arneses y conectores',
    'Ensamble de tarjetas de circuito impreso (PCB)',
    'Servicio de ensamble electrónico',
    'Sensores',
    'Focos y lámparas',
    'Cable y alambre',
    'Acumuladores (baterías)',
    'Equipo y herramienta usada en procesos electrónicos',
    'Dispositivos inalámbricos',
    'Pantallas',
    'Antenas',
    'Cableado',
    'Solenoides y bobinas',
    'Consolas'
];

export const OPCIONES_SECTOR_ELECTRICA_ELECTRONICA = [
    ...RAW_ELECTRICA_ELECTRONICA.sort((a, b) => a.localeCompare(b, 'es')),
    'Otro especifica'
];

// --- SECTOR EMPAQUE ---
export const RAW_EMPAQUE = [
    'Cartón corrugado (cajas, divisores, otros)',
    'Cartón plano (liso, impreso, selección de color)',
    'Bolsas y películas para empaque',
    'Marbetes y etiquetas',
    'Complementarios al empaque: manuales, boletas, otros productos de papel, etc.',
    'Tarimas y contenedores rígidos',
    'Artículos de foam utilizados para empaque',
    'Empaque de burbuja y similares'
];

export const OPCIONES_SECTOR_EMPAQUE = [
    ...RAW_EMPAQUE.sort((a, b) => a.localeCompare(b, 'es')),
    'Otro especifica'
];

// --- SECTOR TI E I4.0 ---
export const RAW_TI_I40 = [
    'Desarrollo de aplicaciones administrativas',
    'Industria 4.0',
    'Desarrollo de aplicaciones de control de proceso',
    'Desarrollo de aplicaciones integradas al producto',
    'Servicio de consultoría en software (desarrollo e implementación)',
    'Servicios de entrenamiento en software',
    'Outsourcing de proyectos y servicios',
    'Automatización de cómputo móvil (equipo de cómputo de fuerza de ventas)',
    'Servicios en telecomunicaciones',
    'Venta de hardware y software',
    'Programación',
    'Soluciones web',
    'Desarrollo de soluciones en industria automotriz a la medida',
    'Software embebido',
    'Ciberseguridad',
    'Fintech (Tecnología Financiera)',
    'Realidad Extendida (VR/AR)',
    'Analítica de Datos',
    'Inteligencia Artificial y Machine Learning',
    'Internet de las Cosas (IoT)',
    'Data Centers'
];

export const OPCIONES_SECTOR_TI_I40 = [
    ...RAW_TI_I40.sort((a, b) => a.localeCompare(b, 'es')),
    'Otro especifica'
];

// --- SECTOR TEXTIL ---
export const RAW_TEXTIL = [
    'Tela de fibras naturales (tejidas y no tejidas)',
    'Tela de fibras sintéticas (tejidas y no tejidas)',
    'Tela de fibras mezcladas (tejidas y no tejidas)',
    'Hule espuma y otros materiales de relleno y acojinado',
    'Alfombras',
    'Cuero y piel',
    'Hilo y cuerda',
    'Teñido, blanqueado, mercerizado, impresión y otros acabados',
    'Servicios de corte, costura, bordado y similares',
    'Insumos asociados a la industria textil / confección (agujas, carretes, tintas, otros)'
];

export const OPCIONES_SECTOR_TEXTIL = [
    ...RAW_TEXTIL.sort((a, b) => a.localeCompare(b, 'es')),
    'Otro especifica'
];

// --- SECTOR SERVICIOS ESPECIALIZADOS ---
export const RAW_SERVICIOS_ESPECIALIZADOS = [
    'Certificación de productos, procesos y empresas',
    'Servicios de planta (mantenimiento, reparación, otros)',
    'Logística integrada / comercio exterior',
    'Servicios de esterilizado',
    'Servicios de sanitización',
    'Servicios de automatización de procesos',
    'Servicios de diseño grafico',
    'Servicios de diseño de producto (ingeniería)',
    'Servicios de inspección y prueba',
    'Servicios de calibración',
    'Servicio de laboratorio',
    'Entrenamiento y consultoría técnica especializada',
    'Traducción de documentos técnicos',
    'Imprenta industrial',
    'Tratamiento de residuos industriales',
    'Servicios de tratamiento de agua',
    'Facturación de cuentas',
    'Construcción de almacenes y edificios',
    'Leasing de equipos',
    'Medios de comunicación',
    'Alquiler de plataformas',
    'Contratación de personal',
    'Compañías de seguros',
    'Consultoría Financiera',
    'Consultoría Legal',
    'Ingeniería Avanzada'
];

export const OPCIONES_SECTOR_SERVICIOS_ESPECIALIZADOS = [
    ...RAW_SERVICIOS_ESPECIALIZADOS.sort((a, b) => a.localeCompare(b, 'es')),
    'Otro especifica'
];

// --- SECTOR MROS ---
export const RAW_MROS = [
    'Servicios de maquinado de piezas de mantenimiento',
    'Checking fixtures',
    'Montaduras',
    'Calibradores',
    'Pinturas y equipo para aplicación',
    'Herramientas de mano',
    'Herramientas eléctricas',
    'Herramientas para maquinaria',
    'Insertos / herramientas de corte',
    'Químicos, ácidos, desengrases',
    'Aceites, lubricantes',
    'Material para limpieza',
    'Racks para almacén y/o producción',
    'Fletes',
    'Diseño y comunicación visual',
    'Abrasivos',
    'Servicios de jardinería',
    'Servicios financieros / bancarios',
    'Dispositivos eléctricos',
    'Dispositivos neumáticos e hidráulicos',
    'Rodamientos, chumaceras, bandas',
    'Papelería',
    'Pailería de construcción',
    'Obra civil (ampliaciones, naves, pailería de construcción)',
    'Servicios de ingeniería y/o automatización',
    'Productos de ferretería',
    'Gases industriales',
    'Suministro de gas',
    'Servicios de personal de seguridad industrial',
    'Filtros aire, aceite, etc',
    'Uniformes',
    'Calzado de seguridad',
    'Equipo de protección personal',
    'Equipo e instalación de sistemas de seguridad',
    'Transporte de personal',
    'Comedor'
];

export const OPCIONES_SECTOR_MROS = [
    ...RAW_MROS.sort((a, b) => a.localeCompare(b, 'es')),
    'Otro especifica'
];

// --- SECTOR MINERO ---
export const RAW_MINERO = [
    'Minerales metálicos',
    'Minerales no metálicos',
    'Mármol y piedra natural',
    'Canteras',
    'Piedra caliza',
    'Agregados para construcción',
    'Procesamiento de minerales',
    'Comercialización de minerales',
    'Servicios para minería',
    'Equipos y suministros mineros',
    'Servicio de molienda'
];

export const OPCIONES_SECTOR_MINERO = [
    ...RAW_MINERO.sort((a, b) => a.localeCompare(b, 'es')),
    'Otro especifica'
];

// --- APOYOS Y NECESIDADES ---
export const OPCIONES_APOYOS = [
    'Financiamiento o inversión',
    'Expansión de mercado: exportación internacional, entrada a nuevos mercados, distribuidores o socios comerciales',
    'Crecimiento empresarial: escalar producción, apertura a nuevas sucursales, automatización de procesos, y/o mejora de productividad',
    'Tecnología e innovación: transformación digital, implementación de software empresarial, inteligencia artificial, y/o comercio electrónico',
    'Talento y recursos humanos: reclutamiento de talento especializado, capacitación de empleados y/o desarrollo de liderazgo',
    'Marketing y ventas: estrategias de marketing digital y/o posicionamiento de marca',
    'Operaciones: optimización logística, cadena de suministro y/o reducción de costos operativos',
    'Regulación y apoyo institucional: trámites regulatorios y certificaciones',
    'Orientación y consulta de los programas de medio ambiente: Programa Estatal para la Prevención y Gestión Integral de Residuos de Querétaro; Fondo para la Protección Ambiental y el Desarrollo Sustentable; Programa Estatal de Acción Ante el Cambio Climático; Verificación vehicular, entre otros',
    'Otro especifique'
];