// src/interfaces/user.interface.ts

export type UserRole = 'admin' | 'editor' | 'lector';

export interface User {
    _id: string;
    nombre: string;
    email: string;
    rol: UserRole;
    activo: boolean;
    createdAt?: string;
}

export interface UserFormData {
    nombre: string;
    email: string;
    password?: string;
    rol: UserRole;
    activo: boolean;
}