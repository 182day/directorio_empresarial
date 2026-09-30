// src/components/CompaniesFollowSheetExcel.ts
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { type FollowRecord } from '../interfaces/follow.interface';
import { type User } from '../interfaces/user.interface';
import { formatFechaLarga } from '../utils/formUtils';

/**
 * Genera y descarga un reporte de Excel de seguimientos con filtrado de columnas según el rol del usuario.
 */
export const exportFollowsToExcel = async (
    follows: FollowRecord[],
    companyName?: string,
    user?: User | null
) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Seguimientos');

    // Validación de roles de usuario (igual a CompaniesSheetExcel.ts)
    const isAdmin = user?.rol === 'admin';
    const canSeeStatus = user?.rol === 'admin' || user?.rol === 'editor';

    // Construcción dinámica de columnas según permisos
    const allColumns: Partial<ExcelJS.Column>[] = [
        ...(isAdmin ? [{ header: 'ID', key: 'id', width: 26 }] : []), // Solo ADMIN
        { header: 'Empresa', key: 'companyName', width: 28 },
        { header: 'Tipo de Seguimiento', key: 'tipoSeguimiento', width: 22 },
        { header: 'Es Vinculación', key: 'esVinculacion', width: 16 },
        { header: 'Medio de Atención', key: 'medioAtencion', width: 22 },
        { header: 'Estatus', key: 'estatus', width: 16 },
        { header: 'Asunto', key: 'asunto', width: 30 },
        { header: 'Descripción / Comentarios', key: 'descripcion', width: 45 },
        { header: 'Atención a', key: 'atencionSeguimiento', width: 25 },
        { header: 'Fecha', key: 'fechaSeguimiento', width: 18 },
        { header: 'Hora', key: 'horaSeguimiento', width: 12 },
        ...(canSeeStatus ? [{ header: 'Registrado Por', key: 'usuario', width: 22 }] : []), // Solo (Admin / Editor)
    ];

    worksheet.columns = allColumns;

    // Estilo del encabezado (Idéntico a CompaniesSheetExcel.ts)
    const headerRow = worksheet.getRow(1);
    headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E3A8A' }, // Azul oscuro
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Mapeo de filas dinámico
    follows.forEach((item) => {
        const rowData: Record<string, any> = {
            ...(isAdmin && { id: item._id || '' }),
            companyName: item.companyName || '',
            tipoSeguimiento: item.tipoSeguimiento || '',
            esVinculacion: item.esVinculacion ? 'Sí' : 'No',
            medioAtencion: item.medioAtencion || '',
            estatus: item.estatus || '',
            asunto: item.asunto || '',
            descripcion: item.descripcion || '',
            atencionSeguimiento: item.atencionSeguimiento || '',
            fechaSeguimiento: item.fechaSeguimiento ? formatFechaLarga(item.fechaSeguimiento) : '',
            horaSeguimiento: item.horaSeguimiento || '',
            ...(canSeeStatus && { usuario: item.usuario || '' }),
        };

        const row = worksheet.addRow(rowData);
        row.alignment = { vertical: 'middle', wrapText: true };

        const statusCell = row.getCell('estatus');
        statusCell.alignment = { vertical: 'middle', horizontal: 'center' };

        const status = String(item.estatus || '').trim();

        if (status === 'Concluido' || status === 'Atendido' || status === 'Completado') {
            statusCell.font = { color: { argb: '15803D' }, bold: true };
            statusCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'DCFCE7' }, // Verde
            };
        } else if (status === 'Pendiente' || status === 'En Proceso' || status === 'Nuevo') {
            statusCell.font = { color: { argb: 'B45309' }, bold: true };
            statusCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FEF3C7' }, // Amarillo / Naranja
            };
        } else if (status === 'Cancelado') {
            statusCell.font = { color: { argb: 'B91C1C' }, bold: true };
            statusCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FEE2E2' }, // Rojo
            };
        }
    });

    // Filtros automáticos en los encabezados
    worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: worksheet.columns.length },
    };

    // Aplicación de bordes a cada celda
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

    // Generación del Blob y descarga
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const prefix = companyName
        ? `Seguimientos_${companyName.replace(/\s+/g, '_')}`
        : 'Reporte_Seguimientos_Global';
        
    const fileName = `${prefix}_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
};