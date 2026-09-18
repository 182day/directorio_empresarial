// src/components/CompaniesFollowSheetExcel.ts
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { type FollowRecord } from '../interfaces/follow.interface';
import { formatFechaLarga } from '../utils/formUtils';

/**
 * Genera y descarga un reporte de Excel con los seguimientos de las empresas.
 */
export const exportFollowsToExcel = async (follows: FollowRecord[], companyName?: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Seguimientos');

    // Definición de columnas
    worksheet.columns = [
        { header: 'ID', key: 'id', width: 26 },
        { header: 'Empresa', key: 'companyName', width: 28 },
        { header: 'Tipo de Seguimiento', key: 'tipoSeguimiento', width: 22 },
        { header: 'Medio de Atención', key: 'medioAtencion', width: 22 },
        { header: 'Estatus', key: 'estatus', width: 16 },
        { header: 'Asunto', key: 'asunto', width: 30 },
        { header: 'Descripción / Comentarios', key: 'descripcion', width: 45 },
        { header: 'Atención a', key: 'atencionSeguimiento', width: 25 },
        { header: 'Fecha', key: 'fechaSeguimiento', width: 18 },
        { header: 'Hora', key: 'horaSeguimiento', width: 12 },
        { header: 'Registrado Por', key: 'usuario', width: 22 },
    ];

    // Estilo del encabezado
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

    // Agregar filas
    follows.forEach((item) => {
        const rowData = {
            id: item._id || '',
            companyName: item.companyName || '',
            tipoSeguimiento: item.tipoSeguimiento || '',
            medioAtencion: item.medioAtencion || '',
            estatus: item.estatus || '',
            asunto: item.asunto || '',
            descripcion: item.descripcion || '',
            atencionSeguimiento: item.atencionSeguimiento || '',
            fechaSeguimiento: item.fechaSeguimiento ? formatFechaLarga(item.fechaSeguimiento) : '',
            horaSeguimiento: item.horaSeguimiento || '',
            usuario: item.usuario || '',
        };

        const row = worksheet.addRow(rowData);
        row.alignment = { vertical: 'middle', wrapText: true };

        // Formato condicional según estatus
        const statusCell = row.getCell('estatus');
        statusCell.alignment = { vertical: 'middle', horizontal: 'center' };

        if (item.estatus === 'Concluido' || item.estatus === 'Atendido') {
            statusCell.font = { color: { argb: '15803D' }, bold: true };
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
        } else if (item.estatus === 'Pendiente') {
            statusCell.font = { color: { argb: 'B45309' }, bold: true };
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } };
        } else if (item.estatus === 'Cancelado') {
            statusCell.font = { color: { argb: 'B91C1C' }, bold: true };
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
        }
    });

    // Filtros automáticos y bordes
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

    // Generar archivo y descargar
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const prefix = companyName ? `Seguimientos_${companyName.replace(/\s+/g, '_')}` : 'Reporte_Seguimientos_Global';
    const fileName = `${prefix}_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
};