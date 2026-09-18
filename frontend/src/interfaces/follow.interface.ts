// src/interfaces/follow.interface.ts
export type FollowUpType = 'Apoyo' | 'Asesoría' | 'Capacitación'| 'Evento' | 'Vinculación' | 'Otro';
export type AttentionMedium = 'Correo' | 'Llamada telefónica' | 'Reunión' | 'Visita' | 'Otro';
export type FollowStatus = 'Nuevo' | 'En Proceso' | 'Completado' | 'Cancelado';

export interface FollowRecord {
  _id?: string;
  empresaId: string;
  companyName?: string;       // Opcional para vistas en tabla/tarjetas
  fechaSeguimiento: string;
  horaSeguimiento?: string;
  tipoSeguimiento: FollowUpType | string;
  medioAtencion?: AttentionMedium | string;
  asunto?: string;
  descripcion: string;
  atencionSeguimiento?: string;
  estatus: FollowStatus | string;
  usuario?: string;
  empresasVinculadas?: string[];
}