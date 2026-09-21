// src/stores/useCompanyStore.ts
import { create } from 'zustand';
import api from '../api/axios';
import { type CompanyFormData } from '../interfaces/company.interface';

interface CompanyState {
    companies: CompanyFormData[];
    loading: boolean;
    hasFetched: boolean;
    fetchCompanies: (forceReload?: boolean) => Promise<void>;
    setCompanies: (companies: CompanyFormData[]) => void;
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
    companies: [],
    loading: false,
    hasFetched: false,

    fetchCompanies: async (forceReload = false) => {
        // Si ya fueron cargadas y no se fuerza la recarga, omitimos la petición al backend
        if (get().hasFetched && !forceReload) {
            return;
        }

        try {
            set({ loading: true });
            const res = await api.get('/companies'); // Sin query params de búsqueda
            set({ 
                companies: res.data, 
                hasFetched: true 
            });
        } catch (err) {
            console.error('Error al cargar empresas:', err);
        } finally {
            set({ loading: false });
        }
    },

    setCompanies: (companies) => set({ companies }),
}));