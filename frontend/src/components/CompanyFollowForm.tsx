// src/components/CompanyFollowForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { type CompanyFormData } from '../interfaces/company.interface';
import { formatDateForInput, sanitizePhoneNumber } from '../utils/formUtils';
import {
  type FollowRecord,
  type FollowUpType,
  type AttentionMedium,
  type FollowStatus,
  type OtraEmpresaData
} from '../interfaces/follow.interface';
import {
  OPCIONES_TIPO_SEGUIMIENTO,
  OPCIONES_MEDIO_ATENCION,
  OPCIONES_ESTATUS_SEGUIMIENTO
} from '../data/followCatalog';
import { ESTADOS_MEXICO, getMunicipiosByEstado } from '../data/locationCatalog';
import { CheckCircle, X, FileText, Building2, Search, ChevronDown, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useCompanyStore } from '../stores/useCompanyStore';

interface Props {
  companyId?: string;
  initialData?: Partial<FollowRecord> | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const CompanyFollowForm: React.FC<Props> = ({ companyId, initialData, onClose, onSuccess }) => {
  const empresas = useCompanyStore((state) => state.companies);
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

  // Estado para capturar datos cuando se selecciona la opción "Otra"
  const [otraEmpresaData, setOtraEmpresaData] = useState<OtraEmpresaData>({
    nombreEmpresa: initialData?.otraEmpresa?.nombreEmpresa || '',
    rfc: initialData?.otraEmpresa?.rfc || '',
    estado: initialData?.otraEmpresa?.estado || '',
    municipio: initialData?.otraEmpresa?.municipio || '',
    nombreContacto: initialData?.otraEmpresa?.nombreContacto || '',
    telefonoContacto: initialData?.otraEmpresa?.telefonoContacto || '',
    correoElectronico: initialData?.otraEmpresa?.correoElectronico || ''
  });

  // Cargar información de la empresa principal si existe companyId
  useEffect(() => {
    const targetCompanyId = companyId || initialData?.empresaId;
    if (targetCompanyId && targetCompanyId !== 'OTRA') {
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
    } else if (targetCompanyId === 'OTRA') {
      setSearchTerm('Otra (Registrar manualmente)');
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

      const isObjectArray = rawVinculadas.length > 0 && typeof rawVinculadas[0] === 'object';
      if (isObjectArray) {
        setSelectedVinculadas(rawVinculadas as unknown as CompanyFormData[]);
      } else if (rawVinculadas.length > 0 && empresas.length > 0) {
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

  const handleSelectOtra = () => {
    setFormData({ ...formData, empresaId: 'OTRA' });
    setSelectedCompany(null);
    setSearchTerm('Otra (Registrar manualmente)');
    setIsDropdownOpen(false);
    if (errors.empresaId) {
      setErrors((prev) => ({ ...prev, empresaId: false }));
    }
  };

  const handleOtraEmpresaChange = (field: keyof OtraEmpresaData, value: string) => {
    const finalValue = field === 'rfc' ? value.toUpperCase() : value;
    setOtraEmpresaData((prev) => ({ ...prev, [field]: finalValue }));
    if (errors[`otraEmpresa.${field}`]) {
      setErrors((prev) => ({ ...prev, [`otraEmpresa.${field}`]: false }));
    }
  };

  const handleOtraEmpresaEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoEstado = e.target.value;
    setOtraEmpresaData((prev) => ({
      ...prev,
      estado: nuevoEstado,
      municipio: ''
    }));
  };

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

  const municipiosDisponibles = getMunicipiosByEstado(otraEmpresaData.estado || '');

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

    if (formData.empresaId === 'OTRA' && !otraEmpresaData.nombreEmpresa.trim()) {
      newErrors['otraEmpresa.nombreEmpresa'] = true;
    }

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
      } else if (newErrors['otraEmpresa.nombreEmpresa']) {
        toast.error('El nombre de la empresa es obligatorio al seleccionar "Otra".');
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

    const payload = {
      ...formData,
      empresasVinculadas: formData.tipoSeguimiento === 'Vinculación' ? formData.empresasVinculadas : [],
      otraEmpresa: formData.empresaId === 'OTRA' ? otraEmpresaData : undefined
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

  // Clase utilitaria para los campos de entrada
  const inputBaseClasses = "w-full bg-app-bg border text-app-text text-sm rounded-lg transition-colors focus:outline-none placeholder:text-app-muted";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* SECCIÓN: INFORMACIÓN GENERAL */}
      <div className="bg-app-card/60 p-5 rounded-xl border border-app-border space-y-4 transition-colors duration-200">
        <h3 className="text-sm font-semibold text-accent-primary uppercase tracking-wider flex items-center gap-2 mb-2">
          <Building2 size={16} /> Información General
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!companyId ? (
            <div className="md:col-span-2 relative" ref={dropdownRef}>
              <label className="block text-xs font-medium text-app-text mb-1">
                Empresa <span className="text-red-500">*</span>
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
                  className={`${inputBaseClasses} pl-9 pr-8 py-2 ${
                    errors.empresaId ? 'border-red-500 focus:border-red-500' : 'border-app-border focus:border-blue-500'
                  }`}
                />
                <Search size={16} className="absolute left-3 top-2.5 text-app-muted" />
                <ChevronDown size={16} className="absolute right-3 top-2.5 text-app-muted pointer-events-none" />
              </div>

              {isDropdownOpen && (
                <ul className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-app-card border border-app-border rounded-lg shadow-xl py-1 text-sm text-app-text">
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
                    <li className="px-4 py-2 text-app-muted text-center text-xs">
                      No se encontraron empresas registradas
                    </li>
                  )}
                  <li
                    onClick={handleSelectOtra}
                    className="px-4 py-2.5 bg-app-bg hover:bg-blue-600 hover:text-white text-blue-500 dark:text-blue-400 cursor-pointer transition-colors font-medium border-t border-app-border flex items-center gap-2"
                  >
                    <PlusCircle size={15} />
                    <span>Otra (Registrar manualmente)</span>
                  </li>
                </ul>
              )}
            </div>
          ) : (
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-app-text mb-1">
                Empresa
              </label>
              <div className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-2 text-sm text-app-text font-medium">
                {selectedCompany ? `${selectedCompany.nombreComercial} (${selectedCompany.rfc})` : 'Cargando datos de la empresa...'}
              </div>
            </div>
          )}

          {/* CAMPOS DINÁMICOS PARA "OTRA" EMPRESA */}
          {formData.empresaId === 'OTRA' && (
            <div className="md:col-span-2 bg-app-bg/50 border border-app-border rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-semibold text-app-text uppercase tracking-wider mb-2">
                Datos de la Empresa no registrada
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-app-text mb-1">
                    Nombre de la empresa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Escriba el nombre comercial o razón social"
                    value={otraEmpresaData.nombreEmpresa}
                    onChange={(e) => handleOtraEmpresaChange('nombreEmpresa', e.target.value)}
                    className={`${inputBaseClasses} px-3 py-2 ${
                      errors['otraEmpresa.nombreEmpresa'] ? 'border-red-500' : 'border-app-border focus:border-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-app-muted mb-1">
                    RFC <span className="text-app-muted/70 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={13}
                    placeholder="RFC de la empresa"
                    value={otraEmpresaData.rfc}
                    onChange={(e) => handleOtraEmpresaChange('rfc', e.target.value)}
                    className={`${inputBaseClasses} border-app-border focus:border-blue-500 px-3 py-2`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-app-muted mb-1">
                    Estado <span className="text-app-muted/70 font-normal">(Opcional)</span>
                  </label>
                  <select
                    value={otraEmpresaData.estado}
                    onChange={handleOtraEmpresaEstadoChange}
                    className={`${inputBaseClasses} border-app-border focus:border-blue-500 px-3 py-2`}
                  >
                    <option value="">-- Selecciona un Estado --</option>
                    {ESTADOS_MEXICO.map((item) => (
                      <option key={item.estado} value={item.estado}>
                        {item.estado}
                      </option>
                    ))}
                  </select>
                </div>

                {otraEmpresaData.estado && (
                  <div>
                    <label className="block text-xs font-medium text-app-muted mb-1">
                      Municipio <span className="text-app-muted/70 font-normal">(Opcional)</span>
                    </label>
                    <select
                      value={otraEmpresaData.municipio}
                      onChange={(e) => handleOtraEmpresaChange('municipio', e.target.value)}
                      className={`${inputBaseClasses} border-app-border focus:border-blue-500 px-3 py-2`}
                    >
                      <option value="">-- Selecciona un Municipio --</option>
                      {municipiosDisponibles.map((muni) => (
                        <option key={muni} value={muni}>
                          {muni}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-app-muted mb-1">
                    Nombre del contacto <span className="text-app-muted/70 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={otraEmpresaData.nombreContacto}
                    onChange={(e) => handleOtraEmpresaChange('nombreContacto', e.target.value)}
                    className={`${inputBaseClasses} border-app-border focus:border-blue-500 px-3 py-2`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-app-muted mb-1">
                    Teléfono de contacto <span className="text-app-muted/70 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10 dígitos"
                    value={otraEmpresaData.telefonoContacto}
                    onChange={(e) => handleOtraEmpresaChange('telefonoContacto', sanitizePhoneNumber(e.target.value, 10))}
                    className={`${inputBaseClasses} border-app-border focus:border-blue-500 px-3 py-2`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-app-muted mb-1">
                    Correo electrónico <span className="text-app-muted/70 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={otraEmpresaData.correoElectronico}
                    onChange={(e) => handleOtraEmpresaChange('correoElectronico', e.target.value.toLowerCase())}
                    className={`${inputBaseClasses} border-app-border focus:border-blue-500 px-3 py-2`}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-app-text mb-1">
              Fecha del Seguimiento <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="fechaSeguimiento"
              value={formData.fechaSeguimiento}
              onChange={handleChange}
              className={`${inputBaseClasses} px-3 py-2 ${
                errors.fechaSeguimiento ? 'border-red-500 focus:border-red-500' : 'border-app-border focus:border-blue-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-app-text mb-1">
              Hora del Seguimiento <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              name="horaSeguimiento"
              value={formData.horaSeguimiento}
              onChange={handleChange}
              className={`${inputBaseClasses} px-3 py-2 ${
                errors.horaSeguimiento ? 'border-red-500 focus:border-red-500' : 'border-app-border focus:border-blue-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-app-text mb-1">
              Tipo de Seguimiento <span className="text-red-500">*</span>
            </label>
            <select
              name="tipoSeguimiento"
              value={formData.tipoSeguimiento}
              onChange={handleChange}
              className={`${inputBaseClasses} px-3 py-2 ${
                errors.tipoSeguimiento ? 'border-red-500 focus:border-red-500' : 'border-app-border focus:border-blue-500'
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
              <label className="block text-xs font-medium text-app-text mb-1">
                Empresas con las que se hizo vinculación <span className="text-app-muted font-normal">(Opcional)</span>
              </label>

              {selectedVinculadas.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 p-2 bg-app-bg rounded-lg border border-app-border">
                  {selectedVinculadas.map((emp, index) => (
                    <span
                      key={emp._id || index}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                    >
                      {emp.nombreComercial || emp.razonSocial || 'Empresa Vinculada'}
                      <button
                        type="button"
                        onClick={() => handleRemoveVinculada(emp._id)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

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
                  className={`${inputBaseClasses} border-app-border focus:border-blue-500 pl-9 pr-8 py-2`}
                />
                <Search size={16} className="absolute left-3 top-2.5 text-app-muted" />
                <ChevronDown size={16} className="absolute right-3 top-2.5 text-app-muted pointer-events-none" />
              </div>

              {isVinculadasDropdownOpen && (
                <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-app-card border border-app-border rounded-lg shadow-xl py-1 text-sm text-app-text">
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
                    <li className="px-4 py-3 text-app-muted text-center">
                      No hay más empresas disponibles
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-app-text mb-1">
              Medio de Atención <span className="text-red-500">*</span>
            </label>
            <select
              name="medioAtencion"
              value={formData.medioAtencion}
              onChange={handleChange}
              className={`${inputBaseClasses} px-3 py-2 ${
                errors.medioAtencion ? 'border-red-500 focus:border-red-500' : 'border-app-border focus:border-blue-500'
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
            <label className="block text-xs font-medium text-app-text mb-1">
              Estatus del Seguimiento <span className="text-red-500">*</span>
            </label>
            <select
              name="estatus"
              value={formData.estatus}
              onChange={handleChange}
              className={`${inputBaseClasses} px-3 py-2 ${
                errors.estatus ? 'border-red-500 focus:border-red-500' : 'border-app-border focus:border-blue-500'
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

      {/* SECCIÓN: DETALLES DEL SEGUIMIENTO */}
      <div className="bg-app-card/60 p-5 rounded-xl border border-app-border space-y-4 transition-colors duration-200">
        <h3 className="text-sm font-semibold text-accent-primary uppercase tracking-wider flex items-center gap-2 mb-2">
          <FileText size={16} /> Detalles del Seguimiento
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-app-text mb-1">
              Asunto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="asunto"
              placeholder="Ej. Revisión de propuesta / Renovación de convenio"
              value={formData.asunto}
              onChange={handleChange}
              className={`${inputBaseClasses} px-3 py-2 ${
                errors.asunto ? 'border-red-500 focus:border-red-500' : 'border-app-border focus:border-blue-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-app-text mb-1">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              name="descripcion"
              rows={4}
              placeholder="Describa los detalles o minutas del seguimiento..."
              value={formData.descripcion}
              onChange={handleChange}
              className={`${inputBaseClasses} p-3 resize-none ${
                errors.descripcion ? 'border-red-500 focus:border-red-500' : 'border-app-border focus:border-blue-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-app-text mb-1">
              Atención al Seguimiento
            </label>
            <textarea
              name="atencionSeguimiento"
              rows={3}
              placeholder="Observaciones o notas adicionales sobre la atención brindada (Opcional)..."
              value={formData.atencionSeguimiento}
              onChange={handleChange}
              className={`${inputBaseClasses} border-app-border focus:border-blue-500 p-3 resize-none`}
            />
          </div>
        </div>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="flex justify-end gap-3 pt-4 border-t border-app-border">
          {onClose && (
              <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-app-border/40 hover:bg-app-border text-app-muted hover:text-app-text rounded-lg text-sm transition-colors"
              >
                  Cancelar
              </button>
          )}
          <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors shadow-lg disabled:opacity-50 cursor-pointer"
          >
              <CheckCircle className="w-4 h-4" />
              <span>
                  {loading ? 'Guardando...' : 'Guardar Seguimiento'}
              </span>
          </button>
      </div>
    </form>
  );
};