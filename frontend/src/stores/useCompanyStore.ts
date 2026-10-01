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
    updateCompanyInStore: (updatedCompany: CompanyFormData) => void;
    addCompanyToStore: (newCompany: CompanyFormData) => void;
    removeCompanyFromStore: (id: string) => void;
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
            console.log('juaaaaan')
            set({ loading: true });
            const res = await api.get('/companies');
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

    // Actualiza los datos de una empresa específica dentro del estado local sin re-consultar todo el backend
    updateCompanyInStore: (updatedCompany) => {
        set((state) => ({
            companies: state.companies.map((company) =>
                company._id === updatedCompany._id ? updatedCompany : company
            ),
        }));
    },

    // Agrega una nueva empresa al estado local
    addCompanyToStore: (newCompany) => {
        set((state) => ({
            companies: [newCompany, ...state.companies],
        }));
    },

    // Remueve una empresa del estado local por su ID
    removeCompanyFromStore: (id) => {
        set((state) => ({
            companies: state.companies.filter((company) => company._id !== id),
        }));
    },
}));