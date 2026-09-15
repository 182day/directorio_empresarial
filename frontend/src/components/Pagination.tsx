import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    pageSize: number | 'all';
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number | 'all') => void;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
}) => {
    // Si la opción seleccionada es 'all', mostramos todos en 1 sola página
    const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalItems / (pageSize as number));

    // Función helper para calcular el rango de páginas con elipsis (...)
    const getPageNumbers = () => {
        if (totalPages <= 7) {
            // Si son 7 páginas o menos, mostramos todas sin elipsis
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const delta = 1; // Número de páginas visibles a los lados de la página actual
        const range: (number | string)[] = [];

        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 || // Primera página
                i === totalPages || // Última página
                (i >= currentPage - delta && i <= currentPage + delta) // Páginas contiguas a la actual
            ) {
                range.push(i);
            } else if (range[range.length - 1] !== '...') {
                range.push('...');
            }
        }

        return range;
    };

    if (totalItems === 0) return null;

    // Rango numérico de registros mostrados actualmente
    const startItem = pageSize === 'all' ? 1 : (currentPage - 1) * (pageSize as number) + 1;
    const endItem = pageSize === 'all' ? totalItems : Math.min(currentPage * (pageSize as number), totalItems);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-lg text-sm text-slate-300">
            {/* IZQUIERDA: Selector de items por página e información */}
            <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Mostrar:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                            onPageSizeChange(val);
                            onPageChange(1); // Reiniciar a página 1 al cambiar tamaño
                        }}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value="all">Todos</option>
                    </select>
                </div>

                <span className="text-xs text-slate-400">
                    Mostrando <strong className="text-white font-medium">{startItem}</strong> -{' '}
                    <strong className="text-white font-medium">{endItem}</strong> de{' '}
                    <strong className="text-white font-medium">{totalItems}</strong>
                </span>
            </div>

            {/* DERECHA: Controles de navegación */}
            {pageSize !== 'all' && totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                    {/* Botón Primera Página */}
                    <button
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-900 disabled:hover:text-slate-400 transition-colors"
                        title="Primera página"
                    >
                        <ChevronsLeft className="w-4 h-4" />
                    </button>

                    {/* Botón Página Anterior */}
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-900 disabled:hover:text-slate-400 transition-colors"
                        title="Página anterior"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Números de página con elipsis (...) */}
                    <div className="flex items-center gap-1 mx-1">
                        {getPageNumbers().map((page, idx) => {
                            if (page === '...') {
                                return (
                                    <span
                                        key={`ellipsis-${idx}`}
                                        className="px-2 py-1 text-xs text-slate-500 font-medium select-none"
                                    >
                                        ...
                                    </span>
                                );
                            }

                            return (
                                <button
                                    key={`page-${page}`}
                                    onClick={() => onPageChange(Number(page))}
                                    className={`min-w-8 h-8 px-2 text-xs font-semibold rounded-lg transition-colors ${
                                        currentPage === page
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-slate-900 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                                    }`}
                                >
                                    {page}
                                </button>
                            );
                        })}
                    </div>

                    {/* Botón Página Siguiente */}
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-900 disabled:hover:text-slate-400 transition-colors"
                        title="Página siguiente"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Botón Última Página */}
                    <button
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-900 disabled:hover:text-slate-400 transition-colors"
                        title="Última página"
                    >
                        <ChevronsRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};