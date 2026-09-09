// src/components/Pagination.tsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number | 'all';
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number | 'all') => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  // Calculamos cuántas páginas hay
  const effectivePageSize = pageSize === 'all' ? totalItems || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));

  // Rango de registros visibles (ej. 1 - 5 de 20)
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * effectivePageSize + 1;
  const endItem = pageSize === 'all'
    ? totalItems
    : Math.min(currentPage * effectivePageSize, totalItems);

  // Manejo de cambio en el Select
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'all') {
      onPageSizeChange('all');
    } else {
      onPageSizeChange(Number(val));
    }
    onPageChange(1); // Reiniciar a la página 1 cuando cambia el rango
  };

  // Generar array de páginas [1, 2, 3...]
  const pagesArray = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-sm text-slate-400 border-t border-slate-800">
      
      {/* 1. INPUT SELECT: Cantidad de registros a mostrar */}
      <div className="flex items-center gap-2">
        <label htmlFor="pageSizeSelect" className="text-xs text-slate-400">
          Mostrar:
        </label>
        <select
          id="pageSizeSelect"
          value={pageSize}
          onChange={handleSelectChange}
          className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
        >
          <option value={5}>5 por página</option>
          <option value={10}>10 por página</option>
          <option value={25}>25 por página</option>
          <option value={50}>50 por página</option>
          <option value={100}>100 por página</option>
          <option value="all">Todos</option>
        </select>

        <span className="text-xs text-slate-500 hidden md:inline ml-2">
          (Mostrando {startItem} - {endItem} de {totalItems})
        </span>
      </div>

      {/* 2. BOTONES DE PAGINACIÓN Y NAVEGACIÓN */}
      {pageSize !== 'all' && totalPages > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {/* Botón Atrás */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Botones numéricos de páginas */}
          {pagesArray.map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                currentPage === pageNum
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {pageNum}
            </button>
          ))}

          {/* Botón Siguiente */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};