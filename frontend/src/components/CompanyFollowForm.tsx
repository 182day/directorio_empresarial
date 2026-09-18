// src/components/CompanyFollowForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { type CompanyFormData } from '../interfaces/company.interface';
import { formatDateForInput } from '../utils/formUtils';
import {
  type FollowRecord,
  type FollowUpType,
  type AttentionMedium,
  type FollowStatus
} from '../interfaces/follow.interface';
import {
  OPCIONES_TIPO_SEGUIMIENTO,
  OPCIONES_MEDIO_ATENCION,
  OPCIONES_ESTATUS_SEGUIMIENTO
} from '../data/followCatalog';
import { Save, X, FileText, Building2, Search, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  companyId?: string;
  initialData?: Partial<FollowRecord> | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const CompanyFollowForm: React.FC<Props> = ({ companyId, initialData, onClose, onSuccess }) => {
  const [empresas, setEmpresas] = useState<CompanyFormData[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyFormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Estados para Empresas Vinculadas (Typeahead Múltiple)
  const [selectedVinculadas, setSelectedVinculadas] = useState<CompanyFormData[]>([]);
  const [searchVinculadasTerm, setSearchVinculadasTerm] = useState('');
  const [isVinculadasDropdownOpen, setIsVinculadasDropdownOpen] = useState(false);
  const dropdownVinculadasRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

  const [formData, setFormData] = useState({
    empresaId: companyId || initialData?.empresaId || '',
    fechaSeguimiento: initialData?.fechaSeguimiento ? formatDateForInput(initialData.fechaSeguimiento) : currentDate,
    horaSeguimiento: initialData?.horaSeguimiento || currentTime,
    tipoSeguimiento: (initialData?.tipoSeguimiento as FollowUpType) || 'Vinculación',
    medioAtencion: (initialData?.medioAtencion as AttentionMedium) || 'Llamada telefónica',
    asunto: initialData?.asunto || '',
    descripcion: initialData?.descripcion || '',
    atencionSeguimiento: initialData?.atencionSeguimiento || '',
    estatus: (initialData?.estatus as FollowStatus) || 'En Proceso',
    empresasVinculadas: Array.isArray(initialData?.empresasVinculadas)
      ? initialData.empresasVinculadas.map((item: any) => typeof item === 'string' ? item : item._id)
      : []
  });

  // Cargar catálogo de empresas
  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const res = await api.get('/companies');
        setEmpresas(res.data);
      } catch (error) {
        console.error('Error al obtener empresas:', error);
      }
    };
    fetchEmpresas();
  }, []);

  // Cargar información de la empresa principal si existe companyId
  useEffect(() => {
    const targetCompanyId = companyId || initialData?.empresaId;
    if (targetCompanyId) {
      const fetchCompanyDetail = async () => {
        try {
          const res = await api.get(`/companies/${targetCompanyId}`);
          setSelectedCompany(res.data);
          setFormData((prev) => ({ ...prev, empresaId: targetCompanyId }));
        } catch (error) {
          console.error('Error al obtener el detalle de la empresa:', error);
        }
      };
      fetchCompanyDetail();
    }
  }, [companyId, initialData?.empresaId]);

  // Cargar empresas vinculadas al EDITAR
  useEffect(() => {
    if (initialData) {
      const rawVinculadas = initialData.empresasVinculadas || [];

      setFormData({
        empresaId: initialData.empresaId || companyId || '',
        fechaSeguimiento: formatDateForInput(initialData.fechaSeguimiento),
        horaSeguimiento: initialData.horaSeguimiento || currentTime,
        tipoSeguimiento: (initialData.tipoSeguimiento as FollowUpType) || 'Vinculación',
        medioAtencion: (initialData.medioAtencion as AttentionMedium) || 'Llamada telefónica',
        asunto: initialData.asunto || '',
        descripcion: initialData.descripcion || '',
        atencionSeguimiento: initialData.atencionSeguimiento || '',
        estatus: (initialData.estatus as FollowStatus) || 'En Proceso',
        empresasVinculadas: rawVinculadas.map((item: any) => typeof item === 'string' ? item : item._id)
      });

      // CASO A: Vienen como Objetos completos desde el backend
      const isObjectArray = rawVinculadas.length > 0 && typeof rawVinculadas[0] === 'object';
      if (isObjectArray) {
        // Uso de (rawVinculadas as unknown as CompanyFormData[]) para evitar la advertencia de TypeScript
        setSelectedVinculadas(rawVinculadas as unknown as CompanyFormData[]);
      }
      // CASO B: Vienen solo los IDs (string[]) -> Esperamos a que cargue el catálogo de 'empresas'
      else if (rawVinculadas.length > 0 && empresas.length > 0) {
        const ids = rawVinculadas as unknown as string[];
        const vinculadas = empresas.filter((emp) => emp._id && ids.includes(emp._id));
        setSelectedVinculadas(vinculadas);
      }
    }
  }, [initialData, empresas]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (dropdownVinculadasRef.current && !dropdownVinculadasRef.current.contains(event.target as Node)) {
        setIsVinculadasDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleSelectCompany = (emp: CompanyFormData) => {
    setFormData({ ...formData, empresaId: emp._id || '' });
    setSelectedCompany(emp);
    setSearchTerm(`${emp.nombreComercial} (${emp.rfc})`);
    setIsDropdownOpen(false);
    if (errors.empresaId) {
      setErrors((prev) => ({ ...prev, empresaId: false }));
    }
  };

  // Handlers para selección múltiple de empresas vinculadas
  const handleAddVinculada = (emp: CompanyFormData) => {
    if (!selectedVinculadas.some((item) => item._id === emp._id)) {
      const updated = [...selectedVinculadas, emp];
      setSelectedVinculadas(updated);
      setFormData((prev) => ({
        ...prev,
        empresasVinculadas: updated.map((item) => item._id || '')
      }));
    }
    setSearchVinculadasTerm('');
    setIsVinculadasDropdownOpen(false);
  };

  const handleRemoveVinculada = (id?: string) => {
    const updated = selectedVinculadas.filter((emp) => emp._id !== id);
    setSelectedVinculadas(updated);
    setFormData((prev) => ({
      ...prev,
      empresasVinculadas: updated.map((item) => item._id || '')
    }));
  };

  const filteredCompanies = empresas.filter((emp) =>
    emp.nombreComercial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.rfc?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtra empresas excluyendo la principal seleccionada y las ya agregadas
  const filteredVinculadasCompanies = empresas.filter((emp) => {
    const isCurrentCompany = emp._id === (companyId || formData.empresaId);
    const isAlreadySelected = selectedVinculadas.some((v) => v._id === emp._id);
    const matchesSearch =
      emp.nombreComercial?.toLowerCase().includes(searchVinculadasTerm.toLowerCase()) ||
      emp.rfc?.toLowerCase().includes(searchVinculadasTerm.toLowerCase());

    return !isCurrentCompany && !isAlreadySelected && matchesSearch;
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, boolean> = {};

    if (!companyId && !formData.empresaId.trim()) newErrors.empresaId = true;
    if (!formData.fechaSeguimiento.trim()) newErrors.fechaSeguimiento = true;
    if (!formData.horaSeguimiento.trim()) newErrors.horaSeguimiento = true;
    if (!formData.tipoSeguimiento.trim()) newErrors.tipoSeguimiento = true;
    if (!formData.medioAtencion.trim()) newErrors.medioAtencion = true;
    if (!formData.asunto.trim()) newErrors.asunto = true;
    if (!formData.descripcion.trim()) newErrors.descripcion = true;
    if (!formData.estatus.trim()) newErrors.estatus = true;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.empresaId) {
        toast.error('Por favor selecciona una empresa de la lista.');
      } else {
        toast.error('Por favor, completa los campos obligatorios marcados en rojo.');
      }
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Si no es tipo 'Vinculación', limpiamos el campo opcional
    const payload = {
      ...formData,
      empresasVinculadas: formData.tipoSeguimiento === 'Vinculación' ? formData.empresasVinculadas : []
    };

    setLoading(true);
    try {
      if (initialData?._id) {
        await api.put(`/companies/follows/${initialData._id}`, payload);
        toast.success('Seguimiento actualizado correctamente.');
      } else {
        await api.post('/companies/follows', payload);
        toast.success('Seguimiento guardado correctamente.');
      }
      onSuccess();
    } catch (error: any) {
      console.error('Error al guardar el seguimiento:', error.response?.data || error);
      const msg = error.response?.data?.errors?.[0]?.msg || 'Ocurrió un error al guardar el seguimiento.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/60 space-y-4">
        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2 mb-2">
          <Building2 size={16} /> Información General
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!companyId ? (
            <div className="md:col-span-2 relative" ref={dropdownRef}>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Empresa <span className="text-red-400">*</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar empresa por nombre o RFC..."
                  value={searchTerm}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setFormData({ ...formData, empresaId: '' });
                    setIsDropdownOpen(true);
                  }}
                  className={`w-full bg-slate-800 border rounded-lg pl-9 pr-8 py-2 text-sm text-white focus:outline-none transition-colors placeholder:text-slate-500 ${errors.empresaId ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'
                    }`}
                />
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <ChevronDown size={16} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
              </div>

              {isDropdownOpen && (
                <ul className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 text-sm text-slate-200">
                  {filteredCompanies.length > 0 ? (
                    filteredCompanies.map((emp) => (
                      <li
                        key={emp._id}
                        onClick={() => handleSelectCompany(emp)}
                        className="px-4 py-2.5 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors flex justify-between items-center"
                      >
                        <span className="font-medium">{emp.nombreComercial}</span>
                        <span className="text-xs opacity-70 ml-2">RFC: {emp.rfc}</span>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-3 text-slate-400 text-center">
                      No se encontraron empresas
                    </li>
                  )}
                </ul>
              )}
            </div>
          ) : (
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Empresa
              </label>
              <div className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-200 font-medium">
                {selectedCompany ? `${selectedCompany.nombreComercial} (${selectedCompany.rfc})` : 'Cargando datos de la empresa...'}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Fecha del Seguimiento <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              name="fechaSeguimiento"
              value={formData.fechaSeguimiento}
              onChange={handleChange}
              className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors ${errors.fechaSeguimiento ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'
                }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Hora del Seguimiento <span className="text-red-400">*</span>
            </label>
            <input
              type="time"
              name="horaSeguimiento"
              value={formData.horaSeguimiento}
              onChange={handleChange}
              className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors ${errors.horaSeguimiento ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'
                }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Tipo de Seguimiento <span className="text-red-400">*</span>
            </label>
            <select
              name="tipoSeguimiento"
              value={formData.tipoSeguimiento}
              onChange={handleChange}
              className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors ${errors.tipoSeguimiento ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'
                }`}
            >
              {OPCIONES_TIPO_SEGUIMIENTO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          {/* Campo Condicional: Empresas Vinculadas */}
          {formData.tipoSeguimiento === 'Vinculación' && (
            <div className="md:col-span-2 relative" ref={dropdownVinculadasRef}>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Empresas con las que se hizo vinculación <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>

              {/* Tags / Chips seleccionados */}
              {selectedVinculadas.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  {selectedVinculadas.map((emp, index) => (
                    <span
                      key={emp._id || index}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-blue-600/30 text-blue-300 border border-blue-500/30"
                    >
                      {emp.nombreComercial || emp.razonSocial || 'Empresa Vinculada'}
                      <button
                        type="button"
                        onClick={() => handleRemoveVinculada(emp._id)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Input Typeahead */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar empresa para vincular..."
                  value={searchVinculadasTerm}
                  onFocus={() => setIsVinculadasDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchVinculadasTerm(e.target.value);
                    setIsVinculadasDropdownOpen(true);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500"
                />
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <ChevronDown size={16} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Dropdown de Opciones */}
              {isVinculadasDropdownOpen && (
                <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 text-sm text-slate-200">
                  {filteredVinculadasCompanies.length > 0 ? (
                    filteredVinculadasCompanies.map((emp) => (
                      <li
                        key={emp._id}
                        onClick={() => handleAddVinculada(emp)}
                        className="px-4 py-2.5 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors flex justify-between items-center"
                      >
                        <span className="font-medium">{emp.nombreComercial}</span>
                        <span className="text-xs opacity-70 ml-2">RFC: {emp.rfc}</span>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-3 text-slate-400 text-center">
                      No hay más empresas disponibles
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Medio de Atención <span className="text-red-400">*</span>
            </label>
            <select
              name="medioAtencion"
              value={formData.medioAtencion}
              onChange={handleChange}
              className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors ${errors.medioAtencion ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'
                }`}
            >
              {OPCIONES_MEDIO_ATENCION.map((medio) => (
                <option key={medio} value={medio}>
                  {medio}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Estatus del Seguimiento <span className="text-red-400">*</span>
            </label>
            <select
              name="estatus"
              value={formData.estatus}
              onChange={handleChange}
              className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors ${errors.estatus ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'
                }`}
            >
              {OPCIONES_ESTATUS_SEGUIMIENTO.map((estatus) => (
                <option key={estatus} value={estatus}>
                  {estatus}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/60 space-y-4">
        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2 mb-2">
          <FileText size={16} /> Detalles del Seguimiento
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Asunto <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="asunto"
              placeholder="Ej. Revisión de propuesta / Renovación de convenio"
              value={formData.asunto}
              onChange={handleChange}
              className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors placeholder:text-slate-500 ${errors.asunto ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'
                }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Descripción <span className="text-red-400">*</span>
            </label>
            <textarea
              name="descripcion"
              rows={4}
              placeholder="Describa los detalles o minutas del seguimiento..."
              value={formData.descripcion}
              onChange={handleChange}
              className={`w-full bg-slate-800 border rounded-lg p-3 text-sm text-white focus:outline-none transition-colors placeholder:text-slate-500 resize-none ${errors.descripcion ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-blue-500'
                }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Atención al Seguimiento
            </label>
            <textarea
              name="atencionSeguimiento"
              rows={3}
              placeholder="Observaciones o notas adicionales sobre la atención brindada (Opcional)..."
              value={formData.atencionSeguimiento}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <X size={16} /> Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
        >
          <Save size={16} />
          {loading ? 'Guardando...' : 'Guardar Seguimiento'}
        </button>
      </div>
    </form>
  );
};