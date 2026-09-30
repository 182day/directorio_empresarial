// src/data/followCatalog.ts

import { type FollowRecord, type FollowUpType, type AttentionMedium, type FollowStatus } from '../interfaces/follow.interface';

export type FollowSortField = keyof FollowRecord;
export const FOLLOW_SORT_OPTIONS: { label: string; value: FollowSortField }[] = [
  { label: 'Fecha de Seguimiento', value: 'fechaSeguimiento' },
  { label: 'Empresa', value: 'companyName' },
  { label: 'Tipo de Seguimiento', value: 'tipoSeguimiento' },
  { label: 'Medio de Atención', value: 'medioAtencion' },
  { label: 'Asunto', value: 'asunto' },
  { label: 'Estatus', value: 'estatus' },
  { label: 'Usuario', value: 'usuario' },
];

export const OPCIONES_TIPO_SEGUIMIENTO: FollowUpType[] = [
  'Apoyo',
  'Asesoría',
  'Capacitación',
  'Evento',
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