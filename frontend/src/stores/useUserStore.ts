// src/stores/useUserStore.ts
import { create } from 'zustand';
import api from '../api/axios';
import { type User, type UserFormData } from '../interfaces/user.interface';

interface UserState {
    users: User[];
    loading: boolean;
    hasFetched: boolean;
    fetchUsers: () => Promise<void>;
    createUser: (formData: UserFormData) => Promise<void>;
    updateUser: (id: string, formData: UserFormData) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
    users: [],
    loading: false,
    hasFetched: false,

    fetchUsers: async () => {
        // Evita reconsultar a la API si ya tenemos los datos en memoria
        if (get().hasFetched) return;

        set({ loading: true });
        try {
            const res = await api.get('/users');
            set({ users: res.data, loading: false, hasFetched: true });
        } catch (error) {
            set({ loading: false });
            throw error;
        }
    },

    createUser: async (formData) => {
        const res = await api.post('/users', formData);
        set((state) => ({ users: [res.data, ...state.users] }));
    },

    updateUser: async (id, formData) => {
        const res = await api.put(`/users/${id}`, formData);
        set((state) => ({
            users: state.users.map((u) => (u._id === id ? res.data : u)),
        }));
    },

    deleteUser: async (id) => {
        await api.delete(`/users/${id}`);
        set((state) => ({
            users: state.users.filter((u) => u._id !== id),
        }));
    },
}));