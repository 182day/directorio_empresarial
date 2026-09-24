// src/stores/useMapCompaniesStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type CompanyFormData } from '../interfaces/company.interface';

// Creamos un canal de transmisión para pestañas del mismo dominio
const broadcastChannel = typeof window !== 'undefined' ? new BroadcastChannel('map_companies_channel') : null;

interface MapCompaniesState {
    mapCompanies: CompanyFormData[];
    setMapCompanies: (companies: CompanyFormData[]) => void;
    clearMapCompanies: () => void;
}

export const useMapCompaniesStore = create<MapCompaniesState>()(
    persist(
        (set) => ({
            mapCompanies: [],
            setMapCompanies: (companies) => {
                set({ mapCompanies: companies });
                // Notificamos a las otras ventanas/pestañas abiertas
                broadcastChannel?.postMessage({ type: 'UPDATE_MAP_COMPANIES', payload: companies });
            },
            clearMapCompanies: () => {
                set({ mapCompanies: [] });
                broadcastChannel?.postMessage({ type: 'UPDATE_MAP_COMPANIES', payload: [] });
            },
        }),
        {
            name: 'map-companies-storage',
        }
    )
);

// Escuchamos los mensajes provenientes de otras pestañas en tiempo real
if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'UPDATE_MAP_COMPANIES') {
            useMapCompaniesStore.setState({ mapCompanies: event.data.payload });
        }
    };
}