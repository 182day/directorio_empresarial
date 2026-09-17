// src/data/followCatalog.ts

import { type FollowUpType, type AttentionMedium, type FollowStatus } from '../interfaces/follow.interface';

export const OPCIONES_TIPO_SEGUIMIENTO: FollowUpType[] = [
  'Apoyo',
  'Asesoría',
  'Capacitación',
  'Evento',
  'Vinculación',
  'Otro'
];

export const OPCIONES_MEDIO_ATENCION: AttentionMedium[] = [
  'Correo',
  'Llamada telefónica',
  'Reunión',
  'Visita',
  'Otro'
];

export const OPCIONES_ESTATUS_SEGUIMIENTO: FollowStatus[] = [
  'Nuevo',
  'En Proceso',
  'Completado',
  'Cancelado'
];