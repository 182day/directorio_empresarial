// src/controllers/auditLogController.ts
import { Request, Response } from 'express';
import { AuditLog } from '../models/AuditLog';

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const isAll = req.query.limit === 'all';
        const limit = isAll ? 0 : (parseInt(req.query.limit as string) || 10);
        const skip = isAll ? 0 : (page - 1) * limit;

        const { fechaInicio, fechaFin, usuarioId, modulo, busqueda } = req.query;

        const queryFilter: any = {};

        if (fechaInicio || fechaFin) {
            queryFilter.createdAt = {};
            if (fechaInicio && fechaInicio !== '') {
                queryFilter.createdAt.$gte = new Date(`${fechaInicio}T00:00:00`);
            }
            if (fechaFin && fechaFin !== '') {
                queryFilter.createdAt.$lte = new Date(`${fechaFin}T23:59:59.999`);
            }
        }

        // Filtra por usuarioId solo si no viene vacío
        if (typeof usuarioId === 'string' && usuarioId.trim() !== '') {
            queryFilter.usuarioId = usuarioId.trim();
        }

        // Filtra por modulo si se pasa como parámetro
        if (typeof modulo === 'string' && modulo.trim() !== '') {
            queryFilter.modulo = modulo.trim();
        }

        // Búsqueda general por regex (Incluye 'modulo')
        if (typeof busqueda === 'string' && busqueda.trim() !== '') {
            queryFilter.$or = [
                { accion: { $regex: busqueda.trim(), $options: 'i' } },
                { modulo: { $regex: busqueda.trim(), $options: 'i' } }, // 👈 AÑADIDO
                { detalles: { $regex: busqueda.trim(), $options: 'i' } }
            ];
        }

        const [rawLogs, total] = await Promise.all([
            AuditLog.find(queryFilter)
                .populate('usuarioId', 'nombre email rol')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            AuditLog.countDocuments(queryFilter)
        ]);

        // Mapeo para que el Frontend siga recibiendo la propiedad 'usuario'
        const logs = rawLogs.map((log: any) => {
            const doc = log.toObject();
            return {
                ...doc,
                usuario: doc.usuarioId
            };
        });

        const totalPages = isAll ? 1 : Math.ceil(total / (limit || 1));

        res.status(200).json({
            logs,
            pagination: {
                total,
                page: isAll ? 1 : page,
                totalPages,
                limit: isAll ? total : limit
            }
        });
    } catch (error: any) {
        console.error('Error en getAuditLogs:', error);
        res.status(500).json({
            message: 'Error al obtener la bitácora de eventos',
            error: error.message
        });
    }
};