// src/utils/getClientIp.ts
import { Request } from 'express';

export const getClientIp = (req: Request): string => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    req.ip ||
    ''
  );
};