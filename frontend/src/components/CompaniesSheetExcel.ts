// src/components/CompaniesSheetExcel.ts
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { type CompanyFormData } from '../interfaces/company.interface';
import { type User } from '../interfaces/user.interface';

const join = (arr?: string[]) => (arr && arr.length > 0 ? arr.join(', ') : '');

const joinConOtro = (grupo?: { lista?: string[]; otroEspecifique?: string }) => {
    if (!grupo) return '';
    const partes = [...(grupo.lista || [])];
    if (grupo.otroEspecifique) partes.push(`Otro: ${grupo.otroEspecifique}`);
    return partes.join(', ');
};

const porcentaje = (val?: number | '') => (val === '' || val === undefined || val === null ? '' : val);

const coordenada = (val?: number | string) => (val === undefined || val === null || val === '' ? '' : Number(val));

const formatearFecha = (fecha?: string | Date) => {
    if (!fecha) return '';
    const d = new Date(fecha);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
};

/**
 * Genera y descarga un reporte de Excel con filtrado de columnas según el rol del usuario.
 */
export const exportCompaniesToExcel = async (companies: CompanyFormData[], user: User | null) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Empresas');

    // Validación de roles de usuario
    const isAdmin = user?.rol === 'admin';
    const canSeeStatus = user?.rol === 'admin' || user?.rol === 'editor';

    // Construcción dinámica de columnas según permisos
    const allColumns: Partial<ExcelJS.Column>[] = [
        ...(isAdmin ? [{ header: 'ID', key: 'id', width: 26 }] : []), // Solo ADMIN
        { header: 'Nombre Comercial', key: 'nombreComercial', width: 28 },
        { header: 'Razón Social', key: 'razonSocial', width: 28 },
        { header: 'RFC', key: 'rfc', width: 16 },
        { header: 'Correo Electrónico', key: 'correoElectronico', width: 28 },
        { header: 'Tipo de Empresa', key: 'tipoEmpresa', width: 22 }, // 👈 Nuevo campo añadido
        { header: 'Tamaño', key: 'tamanoEmpresa', width: 14 },
        { header: 'Año de Inicio', key: 'anioInicio', width: 14 },
        { header: 'Sitio Web', key: 'sitioWeb', width: 26 },
        
        // Fecha de Registro y Estatus condicionados por canSeeStatus
        ...(canSeeStatus ? [
            { header: 'Fecha de Registro', key: 'createdAt', width: 18 },
            { header: 'Estatus', key: 'estatus', width: 12 }
        ] : []),

        { header: 'Etiquetas', key: 'etiquetas', width: 26 },
        { header: 'Tipo de Operaciones', key: 'tipoOperaciones', width: 26 },
        { header: 'Tipo de Suministro', key: 'tipoSuministro', width: 22 },

        // --- Ubicación ---
        { header: 'Estado', key: 'estado', width: 20 },
        { header: 'Municipio', key: 'municipio', width: 20 },
        { header: 'Dirección', key: 'direccion', width: 30 },
        { header: 'Colonia', key: 'colonia', width: 22 },
        { header: 'Código Postal', key: 'codigoPostal', width: 14 },
        { header: 'Parque Industrial', key: 'parqueIndustrial', width: 24 },

        // Latitud y Longitud únicamente visibles si canSeeStatus es true
        ...(canSeeStatus ? [
            { header: 'Latitud', key: 'latitud', width: 16 },
            { header: 'Longitud', key: 'longitud', width: 16 },
        ] : []),

        // --- Contacto: Director General ---
        { header: 'Director General - Nombre', key: 'dgNombre', width: 26 },
        { header: 'Director General - Teléfono', key: 'dgTelefono', width: 18 },
        { header: 'Director General - Celular/WhatsApp', key: 'dgCelular', width: 20 },
        { header: 'Director General - Correo', key: 'dgCorreo', width: 28 },

        // --- Contacto: Compras ---
        { header: 'Compras - Nombre', key: 'comprasNombre', width: 26 },
        { header: 'Compras - Cargo', key: 'comprasCargo', width: 20 },
        { header: 'Compras - Teléfono', key: 'comprasTelefono', width: 18 },
        { header: 'Compras - Celular/WhatsApp', key: 'comprasCelular', width: 20 },
        { header: 'Compras - Correo', key: 'comprasCorreo', width: 28 },

        // --- Contacto: Ventas ---
        { header: 'Ventas - Nombre', key: 'ventasNombre', width: 26 },
        { header: 'Ventas - Cargo', key: 'ventasCargo', width: 20 },
        { header: 'Ventas - Teléfono', key: 'ventasTelefono', width: 18 },
        { header: 'Ventas - Celular/WhatsApp', key: 'ventasCelular', width: 20 },
        { header: 'Ventas - Correo', key: 'ventasCorreo', width: 28 },

        // --- Contacto: Recursos Humanos ---
        { header: 'RH - Nombre', key: 'rhNombre', width: 26 },
        { header: 'RH - Cargo', key: 'rhCargo', width: 20 },
        { header: 'RH - Teléfono', key: 'rhTelefono', width: 18 },
        { header: 'RH - Celular/WhatsApp', key: 'rhCelular', width: 20 },
        { header: 'RH - Correo', key: 'rhCorreo', width: 28 },

        // --- Información de la Empresa ---
        { header: 'Productos que Fabrica', key: 'productosFabrica', width: 34 },
        { header: 'Principales Clientes', key: 'principalesClientes', width: 30 },
        { header: 'País de Origen', key: 'paisOrigen', width: 20 },
        { header: '% Inversión Nacional', key: 'inversionNacional', width: 16 },
        { header: '% Inversión Extranjera', key: 'inversionExtranjero', width: 18 },
        { header: 'Certificaciones', key: 'certificaciones', width: 34 },
        { header: 'Sectores a los que Pertenece', key: 'sectoresPertenece', width: 34 },
        { header: 'Sector Plásticos', key: 'sectorPlasticos', width: 34 },
        { header: 'Sector Metalmecánico', key: 'sectorMetalmecanico', width: 34 },
        { header: 'Sector Eléctrica-Electrónica', key: 'sectorElectricaElectronica', width: 34 },
        { header: 'Sector Empaque', key: 'sectorEmpaque', width: 34 },
        { header: 'Sector TI e I4.0', key: 'sectorTiI40', width: 34 },
        { header: 'Sector Textil', key: 'sectorTextil', width: 34 },
        { header: 'Sector Servicios Especializados', key: 'sectorServiciosEspecializados', width: 34 },
        { header: 'Sector MROS', key: 'sectorMros', width: 34 },
        { header: 'Sector Minero', key: 'sectorMinero', width: 34 },
        { header: 'Sector Principal que Atiende', key: 'principalSectorAtiende', width: 26 },
        { header: '% Exportaciones', key: 'porcentajeExportaciones', width: 16 },
        { header: 'Destino de Exportaciones', key: 'destinoExportaciones', width: 30 },

        // --- Otros ---
        { header: 'Retos Actuales', key: 'retosActuales', width: 36 },
        { header: 'Apoyos y Necesidades', key: 'apoyosYNecesidades', width: 36 },
        { header: 'Presentación Comercial', key: 'presentacionComercial', width: 36 },
    ];

    worksheet.columns = allColumns;

    // Estilo del encabezado
    const headerRow = worksheet.getRow(1);
    headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E3A8A' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    companies.forEach((company) => {
        const estatusTexto = company.activa ? 'Activo' : 'Inactivo';
        const info = company.informacionEmpresa;
        const contactos = company.contactos;
        const tipoEmpresaValor = company.tipoEmpresa || 'Empresa directorio';

        const rowData: Record<string, any> = {
            ...(isAdmin && { id: company._id }),
            nombreComercial: company.nombreComercial,
            razonSocial: company.razonSocial,
            rfc: company.rfc,
            correoElectronico: company.correoElectronico,
            tipoEmpresa: tipoEmpresaValor, // Valor asignado
            tamanoEmpresa: company.tamanoEmpresa,
            anioInicio: company.anioInicio,
            sitioWeb: company.sitioWeb,
            ...(canSeeStatus && { 
                createdAt: formatearFecha(company.createdAt),
                estatus: estatusTexto 
            }),
            etiquetas: join(company.etiquetas),
            tipoOperaciones: join(company.tipoOperaciones),
            tipoSuministro: join(company.tipoSuministro),

            estado: company.ubicacion?.estado || '',
            municipio: company.ubicacion?.municipio || '',
            direccion: company.ubicacion?.direccion || '',
            colonia: company.ubicacion?.colonia || '',
            codigoPostal: company.ubicacion?.codigoPostal || '',
            parqueIndustrial: company.ubicacion?.parqueIndustrial || '',
            
            ...(canSeeStatus && {
                latitud: coordenada(company.ubicacion?.latitud),
                longitud: coordenada(company.ubicacion?.longitud),
            }),

            dgNombre: contactos?.directorGeneral?.nombreCompleto || '',
            dgTelefono: contactos?.directorGeneral?.telefono || '',
            dgCelular: contactos?.directorGeneral?.celularWhatsapp || '',
            dgCorreo: contactos?.directorGeneral?.correoElectronico || '',

            comprasNombre: contactos?.compras?.nombreCompleto || '',
            comprasCargo: contactos?.compras?.cargo || '',
            comprasTelefono: contactos?.compras?.telefono || '',
            comprasCelular: contactos?.compras?.celularWhatsapp || '',
            comprasCorreo: contactos?.compras?.correoElectronico || '',

            ventasNombre: contactos?.ventas?.nombreCompleto || '',
            ventasCargo: contactos?.ventas?.cargo || '',
            ventasTelefono: contactos?.ventas?.telefono || '',
            ventasCelular: contactos?.ventas?.celularWhatsapp || '',
            ventasCorreo: contactos?.ventas?.correoElectronico || '',

            rhNombre: contactos?.recursosHumanos?.nombreCompleto || '',
            rhCargo: contactos?.recursosHumanos?.cargo || '',
            rhTelefono: contactos?.recursosHumanos?.telefono || '',
            rhCelular: contactos?.recursosHumanos?.celularWhatsapp || '',
            rhCorreo: contactos?.recursosHumanos?.correoElectronico || '',

            productosFabrica: info?.productosFabrica || '',
            principalesClientes: info?.principalesClientes || '',
            paisOrigen: info?.paisOrigen === 'Otro' && info?.paisOrigenOtro
                ? `Otro: ${info.paisOrigenOtro}`
                : info?.paisOrigen || '',
            inversionNacional: porcentaje(info?.porcentajeInversionNacional),
            inversionExtranjero: porcentaje(info?.porcentajeInversionExtranjero),
            certificaciones: joinConOtro(info?.certificaciones),
            sectoresPertenece: joinConOtro(info?.sectoresPertenece),
            sectorPlasticos: joinConOtro(info?.sectorPlasticos),
            sectorMetalmecanico: joinConOtro(info?.sectorMetalmecanico),
            sectorElectricaElectronica: joinConOtro(info?.sectorElectricaElectronica),
            sectorEmpaque: joinConOtro(info?.sectorEmpaque),
            sectorTiI40: joinConOtro(info?.sectorTiI40),
            sectorTextil: joinConOtro(info?.sectorTextil),
            sectorServiciosEspecializados: joinConOtro(info?.sectorServiciosEspecializados),
            sectorMros: joinConOtro(info?.sectorMros),
            sectorMinero: joinConOtro(info?.sectorMinero),
            principalSectorAtiende: info?.principalSectorAtiende || '',
            porcentajeExportaciones: porcentaje(info?.porcentajeExportaciones),
            destinoExportaciones: join(info?.destinoExportaciones),

            retosActuales: company.retosActuales || '',
            apoyosYNecesidades: [
                join(company.apoyosYNecesidades?.tipos),
                company.apoyosYNecesidades?.otroEspecifique ? `Otro: ${company.apoyosYNecesidades.otroEspecifique}` : '',
            ].filter(Boolean).join(' | '),
            presentacionComercial: company.presentacionComercial || '',
        };

        const row = worksheet.addRow(rowData);
        row.alignment = { vertical: 'middle', wrapText: false };

        // 👈 Formato condicional para la celda de Tipo de Empresa
        const tipoEmpresaCell = row.getCell('tipoEmpresa');
        tipoEmpresaCell.alignment = { vertical: 'middle', horizontal: 'center' };

        if (tipoEmpresaValor === 'Empresa incompleta') {
            tipoEmpresaCell.font = { color: { argb: 'D97706' }, bold: true }; // Texto ámbar
            tipoEmpresaCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FEF3C7' }, // Fondo ámbar claro
            };
        } else {
            tipoEmpresaCell.font = { color: { argb: '2563EB' }, bold: true }; // Texto azul
            tipoEmpresaCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'DBEAFE' }, // Fondo azul claro
            };
        }

        // Formato condicional para la celda de Estatus
        if (canSeeStatus) {
            const statusCell = row.getCell('estatus');
            statusCell.alignment = { vertical: 'middle', horizontal: 'center' };

            if (company.activa) {
                statusCell.font = { color: { argb: '15803D' }, bold: true };
                statusCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'DCFCE7' },
                };
            } else {
                statusCell.font = { color: { argb: 'B91C1C' }, bold: true };
                statusCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FEE2E2' },
                };
            }
        }
    });

    worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: worksheet.columns.length },
    };

    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin', color: { argb: 'E2E8F0' } },
                left: { style: 'thin', color: { argb: 'E2E8F0' } },
                bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
                right: { style: 'thin', color: { argb: 'E2E8F0' } },
            };
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const fileName = `Reporte_Empresas_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
};