// src/components/CompaniesPDFDocument.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { type CompanyFormData } from '../interfaces/company.interface';
import { type User } from '../interfaces/user.interface';

// Interfaz para el registro de seguimientos
export interface FollowRecord {
  _id?: string;
  fechaSeguimiento?: string;
  tipoSeguimiento?: string;
  medioAtencion?: string;
  asunto?: string;
  estatus?: string;
  observaciones?: string;
}

interface CompaniesPDFProps {
  company?: CompanyFormData;
  companies?: CompanyFormData[]; // Compatible para imprimir 1 o varias empresas
  follows?: FollowRecord[];
  isFromFollows?: boolean;
  full?: boolean;
  user?: User | null;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a8a',
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 9,
    color: '#475569',
    marginTop: 2,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  badgeActive: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
  },
  badgeInactive: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  },
  section: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    marginBottom: 6,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 2,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  col6: {
    width: '50%',
    paddingRight: 6,
    marginBottom: 4,
  },
  col12: {
    width: '100%',
    marginBottom: 4,
  },
  col3: {
    width: '25%',
    paddingRight: 4,
    marginBottom: 4,
  },
  label: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    marginBottom: 1,
  },
  value: {
    fontSize: 8,
    color: '#0f172a',
  },
  contactBox: {
    width: '50%',
    padding: 6,
    marginBottom: 6,
    backgroundColor: '#ffffff',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 3,
  },
  tag: {
    backgroundColor: '#e0e7ff',
    color: '#3730a3',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    fontSize: 7,
  },
  // Estilos para la tabla de seguimientos
  table: {
    width: '100%',
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#cbd5e1',
    padding: 4,
    borderRadius: 2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 4,
  },
  th: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
  },
  td: {
    fontSize: 7,
    color: '#334155',
  },
  colFecha: { width: '15%' },
  colTipo: { width: '15%' },
  colMedio: { width: '15%' },
  colAsunto: { width: '40%' },
  colEstatus: { width: '15%' },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 5,
  },
});

export const CompaniesPDFDocument: React.FC<CompaniesPDFProps> = ({
  company,
  companies,
  follows = [],
  isFromFollows = false,
  full = false,
  user = null
}) => {
  // Manejo de compatibilidad para recibir una lista o una sola empresa
  const listToRender = companies && companies.length > 0 ? companies : company ? [company] : [];

  const fechaImpresion = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Validación de roles de usuario
  //const isAdmin = user?.rol === 'admin';
  const canSeeStatus = user?.rol === 'admin' || user?.rol === 'editor';

  return (
    <Document>
      {listToRender.map((comp, index) => {
        // Extraer sectores con datos
        const sectoresInfo = comp.informacionEmpresa;
        const listaSectores: { nombre: string; items: string[]; otro?: string }[] = [];

        if (sectoresInfo) {
          if (sectoresInfo.sectoresPertenece?.lista?.length) listaSectores.push({ nombre: 'General', items: sectoresInfo.sectoresPertenece.lista, otro: sectoresInfo.sectoresPertenece.otroEspecifique });
          if (sectoresInfo.sectorPlasticos?.lista?.length) listaSectores.push({ nombre: 'Plásticos', items: sectoresInfo.sectorPlasticos.lista, otro: sectoresInfo.sectorPlasticos.otroEspecifique });
          if (sectoresInfo.sectorMetalmecanico?.lista?.length) listaSectores.push({ nombre: 'Metalmecánico', items: sectoresInfo.sectorMetalmecanico.lista, otro: sectoresInfo.sectorMetalmecanico.otroEspecifique });
          if (sectoresInfo.sectorElectricaElectronica?.lista?.length) listaSectores.push({ nombre: 'Eléctrica / Electrónica', items: sectoresInfo.sectorElectricaElectronica.lista, otro: sectoresInfo.sectorElectricaElectronica.otroEspecifique });
          if (sectoresInfo.sectorEmpaque?.lista?.length) listaSectores.push({ nombre: 'Empaque', items: sectoresInfo.sectorEmpaque.lista, otro: sectoresInfo.sectorEmpaque.otroEspecifique });
          if (sectoresInfo.sectorTiI40?.lista?.length) listaSectores.push({ nombre: 'TI / Industria 4.0', items: sectoresInfo.sectorTiI40.lista, otro: sectoresInfo.sectorTiI40.otroEspecifique });
          if (sectoresInfo.sectorTextil?.lista?.length) listaSectores.push({ nombre: 'Textil', items: sectoresInfo.sectorTextil.lista, otro: sectoresInfo.sectorTextil.otroEspecifique });
          if (sectoresInfo.sectorServiciosEspecializados?.lista?.length) listaSectores.push({ nombre: 'Servicios Especializados', items: sectoresInfo.sectorServiciosEspecializados.lista, otro: sectoresInfo.sectorServiciosEspecializados.otroEspecifique });
          if (sectoresInfo.sectorMros?.lista?.length) listaSectores.push({ nombre: 'MROs', items: sectoresInfo.sectorMros.lista, otro: sectoresInfo.sectorMros.otroEspecifique });
          if (sectoresInfo.sectorMinero?.lista?.length) listaSectores.push({ nombre: 'Minero', items: sectoresInfo.sectorMinero.lista, otro: sectoresInfo.sectorMinero.otroEspecifique });
        }

        return (
          <Page key={comp._id || index} size="LETTER" style={styles.page}>

            {/* ENCABEZADO */}
            <View style={styles.header}>
              <View style={{ width: '75%' }}>
                <Text style={styles.title}>{comp.nombreComercial || 'Ficha Técnica de Empresa'}</Text>
                <Text style={styles.subtitle}>{comp.razonSocial || 'Sin Razón Social'}</Text>
              </View>
              {full && (
                <View style={{ alignItems: 'flex-end' }}>
                  {canSeeStatus && (
                    <Text style={[styles.badge, comp.activa ? styles.badgeActive : styles.badgeInactive]}>
                      {comp.activa ? 'ESTATUS: ACTIVO' : 'ESTATUS: INACTIVO'}
                    </Text>
                  )}
                  <Text style={{ fontSize: 7, color: '#64748b', marginTop: 4 }}>
                    RFC: {comp.rfc || 'N/A'}
                  </Text>
                </View>
              )}
            </View>

            {/* SECCIÓN 1: DATOS GENERALES Y UBICACIÓN */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Información General y Ubicación</Text>
              <View style={styles.grid2}>
                {full && (<>
                  <View style={styles.col3}>
                    <Text style={styles.label}>Tamaño de Empresa:</Text>
                    <Text style={styles.value}>{comp.tamanoEmpresa || 'N/A'}</Text>
                  </View>
                  <View style={styles.col3}>
                    <Text style={styles.label}>Año de Inicio:</Text>
                    <Text style={styles.value}>{comp.anioInicio || 'N/A'}</Text>
                  </View>
                  <View style={styles.col6}>
                    <Text style={styles.label}>Correo Electrónico Principal:</Text>
                    <Text style={styles.value}>{comp.correoElectronico || 'N/A'}</Text>
                  </View>
                </>)}
                <View style={styles.col6}>
                  <Text style={styles.label}>Sitio Web:</Text>
                  <Text style={styles.value}>{comp.sitioWeb || 'N/A'}</Text>
                </View>
                {full && (
                  <View style={styles.col6}>
                    <Text style={styles.label}>Presentación Comercial:</Text>
                    <Text style={styles.value}>{comp.presentacionComercial || 'N/A'}</Text>
                  </View>
                )}
                <View style={styles.col12}>
                  <Text style={styles.label}>Dirección Completa:</Text>
                  <Text style={styles.value}>
                    {comp.ubicacion?.direccion || ''} {comp.ubicacion?.colonia ? `, Col. ${comp.ubicacion.colonia}` : ''} {comp.ubicacion?.codigoPostal ? `, C.P. ${comp.ubicacion.codigoPostal}` : ''}
                  </Text>
                </View>
                <View style={styles.col3}>
                  <Text style={styles.label}>Municipio:</Text>
                  <Text style={styles.value}>{comp.ubicacion?.municipio || 'N/A'}</Text>
                </View>
                <View style={styles.col3}>
                  <Text style={styles.label}>Estado:</Text>
                  <Text style={styles.value}>{comp.ubicacion?.estado || 'N/A'}</Text>
                </View>
                {(full && comp.ubicacion?.parqueIndustrial) && (
                  <View style={styles.col6}>
                    <Text style={styles.label}>Parque Industrial:</Text>
                    <Text style={styles.value}>{comp.ubicacion?.parqueIndustrial || 'N/A'}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* SECCIÓN 2: DIRECTIVO Y CONTACTOS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Contacto de la Empresa</Text>
              <View style={styles.grid2}>
                {/* Director General */}
                {full && (
                  <View style={styles.contactBox}>
                    <Text style={[styles.label, { color: '#1e3a8a' }]}>Director General</Text>
                    <Text style={styles.value}>{comp.contactos?.directorGeneral?.nombreCompleto || 'No registrado'}</Text>
                    <Text style={{ fontSize: 7, color: '#475569' }}>Tel: {comp.contactos?.directorGeneral?.telefono || comp.contactos?.directorGeneral?.celularWhatsapp || 'N/A'}</Text>
                    <Text style={{ fontSize: 7, color: '#475569' }}>Correo: {comp.contactos?.directorGeneral?.correoElectronico || 'N/A'}</Text>
                  </View>
                )}

                {/* Compras */}
                {full && (
                  <View style={styles.contactBox}>
                    <Text style={[styles.label, { color: '#1e3a8a' }]}>Área de Compras</Text>
                    <Text style={styles.value}>{comp.contactos?.compras?.nombreCompleto || 'No registrado'} {comp.contactos?.compras?.cargo ? `(${comp.contactos.compras.cargo})` : ''}</Text>
                    <Text style={{ fontSize: 7, color: '#475569' }}>Tel: {comp.contactos?.compras?.telefono || comp.contactos?.compras?.celularWhatsapp || 'N/A'}</Text>
                    <Text style={{ fontSize: 7, color: '#475569' }}>Correo: {comp.contactos?.compras?.correoElectronico || 'N/A'}</Text>
                  </View>
                )}

                {/* Ventas */}
                <View style={styles.contactBox}>
                  <Text style={[styles.label, { color: '#1e3a8a' }]}>Área de Ventas</Text>
                  <Text style={styles.value}>{comp.contactos?.ventas?.nombreCompleto || 'No registrado'} {comp.contactos?.ventas?.cargo ? `(${comp.contactos.ventas.cargo})` : ''}</Text>
                  <Text style={{ fontSize: 7, color: '#475569' }}>Tel: {comp.contactos?.ventas?.telefono || comp.contactos?.ventas?.celularWhatsapp || 'N/A'}</Text>
                  <Text style={{ fontSize: 7, color: '#475569' }}>Correo: {comp.contactos?.ventas?.correoElectronico || 'N/A'}</Text>
                </View>

                {/* Recursos Humanos */}
                {full && (
                  <View style={styles.contactBox}>
                    <Text style={[styles.label, { color: '#1e3a8a' }]}>Recursos Humanos</Text>
                    <Text style={styles.value}>{comp.contactos?.recursosHumanos?.nombreCompleto || 'No registrado'} {comp.contactos?.recursosHumanos?.cargo ? `(${comp.contactos.recursosHumanos.cargo})` : ''}</Text>
                    <Text style={{ fontSize: 7, color: '#475569' }}>Tel: {comp.contactos?.recursosHumanos?.telefono || comp.contactos?.recursosHumanos?.celularWhatsapp || 'N/A'}</Text>
                    <Text style={{ fontSize: 7, color: '#475569' }}>Correo: {comp.contactos?.recursosHumanos?.correoElectronico || 'N/A'}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* SECCIÓN 3: CAPACIDAD INDUSTRIAL Y OPERATIVA */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Información Industrial y Operativa</Text>
              <View style={styles.grid2}>
                <View style={styles.col6}>
                  <Text style={styles.label}>Productos / Servicios que Fabrica:</Text>
                  <Text style={styles.value}>{comp.informacionEmpresa?.productosFabrica || 'N/A'}</Text>
                </View>
                {full && (<>
                  <View style={styles.col6}>
                    <Text style={styles.label}>Principales Clientes:</Text>
                    <Text style={styles.value}>{comp.informacionEmpresa?.principalesClientes || 'N/A'}</Text>
                  </View>
                  <View style={styles.col3}>
                    <Text style={styles.label}>País de Origen:</Text>
                    <Text style={styles.value}>{comp.informacionEmpresa?.paisOrigen || 'N/A'}</Text>
                  </View>
                  <View style={styles.col3}>
                    <Text style={styles.label}>Inv. Nacional / Extranjera:</Text>
                    <Text style={styles.value}>
                      {comp.informacionEmpresa?.porcentajeInversionNacional ? `${comp.informacionEmpresa.porcentajeInversionNacional}% Nac.` : ''}
                      {comp.informacionEmpresa?.porcentajeInversionExtranjero ? ` / ${comp.informacionEmpresa.porcentajeInversionExtranjero}% Ext.` : ''}
                      {!comp.informacionEmpresa?.porcentajeInversionNacional && !comp.informacionEmpresa?.porcentajeInversionExtranjero ? 'N/A' : ''}
                    </Text>
                  </View>
                </>)}

                <View style={styles.col6}>
                  <Text style={styles.label}>Principal Sector al que Atiende:</Text>
                  <Text style={styles.value}>{comp.informacionEmpresa?.principalSectorAtiende || 'N/A'}</Text>
                </View>

                {/* Operaciones y Suministros */}
                <View style={styles.col6}>
                  <Text style={styles.label}>Tipos de Operaciones:</Text>
                  <Text style={styles.value}>{comp.tipoOperaciones?.join(', ') || 'N/A'}</Text>
                </View>
                <View style={styles.col6}>
                  <Text style={styles.label}>Tipos de Suministro:</Text>
                  <Text style={styles.value}>{comp.tipoSuministro?.join(', ') || 'N/A'}</Text>
                </View>

                {/* Certificaciones */}
                <View style={styles.col12}>
                  <Text style={styles.label}>Certificaciones:</Text>
                  <Text style={styles.value}>
                    {comp.informacionEmpresa?.certificaciones?.lista?.join(', ') || 'Ninguna'}
                    {comp.informacionEmpresa?.certificaciones?.otroEspecifique ? ` (${comp.informacionEmpresa.certificaciones.otroEspecifique})` : ''}
                  </Text>
                </View>

                {/* Comercio Exterior */}
                {full && (
                  <View style={styles.col12}>
                    <Text style={styles.label}>Comercio Exterior / Exportaciones:</Text>
                    <Text style={styles.value}>
                      {comp.informacionEmpresa?.porcentajeExportaciones ? `${comp.informacionEmpresa.porcentajeExportaciones}% exportación` : 'No registra exportaciones.'}
                      {comp.informacionEmpresa?.destinoExportaciones?.length ? ` | Destinos: ${comp.informacionEmpresa.destinoExportaciones.join(', ')}` : ''}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* SECCIÓN 4: SECTORES PARTICULARES, RETOS Y APOYOS */}
            {full && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>4. Sectores Específicos, Retos y Apoyos</Text>

                {/* Desglose de Sectores */}
                {listaSectores.length > 0 && (
                  <View style={{ marginBottom: 6 }}>
                    <Text style={styles.label}>Especialización por Sector:</Text>
                    {listaSectores.map((sec, i) => (
                      <Text key={i} style={[styles.value, { fontSize: 7.5 }]}>
                        • <Text style={{ fontFamily: 'Helvetica-Bold' }}>{sec.nombre}:</Text> {sec.items.join(', ')} {sec.otro ? `(${sec.otro})` : ''}
                      </Text>
                    ))}
                  </View>
                )}

                <View style={styles.grid2}>
                  <View style={styles.col6}>
                    <Text style={styles.label}>Retos Actuales:</Text>
                    <Text style={styles.value}>{comp.retosActuales || 'Sin especificar'}</Text>
                  </View>
                  <View style={styles.col6}>
                    <Text style={styles.label}>Apoyos y Necesidades Requeridas:</Text>
                    <Text style={styles.value}>
                      {comp.apoyosYNecesidades?.tipos?.join(', ') || 'Sin especificar'}
                      {comp.apoyosYNecesidades?.otroEspecifique ? ` (${comp.apoyosYNecesidades.otroEspecifique})` : ''}
                    </Text>
                  </View>
                </View>

                {/* Etiquetas / Tags */}
                {comp.etiquetas && comp.etiquetas.length > 0 && (
                  <View style={{ marginTop: 6 }}>
                    <Text style={styles.label}>Etiquetas / Tags de Clasificación:</Text>
                    <View style={styles.tagContainer}>
                      {comp.etiquetas.map((tag, tIdx) => (
                        <Text key={tIdx} style={styles.tag}>#{tag}</Text>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* SECCIÓN 5: HISTORIAL DE SEGUIMIENTOS (SOLO SI VIENE DESDE SEGUIMIENTOS) */}
            {isFromFollows && (
              <View style={styles.section} wrap={false}>
                <Text style={styles.sectionTitle}>
                  5. Historial de Seguimientos ({follows.length})
                </Text>

                {follows.length > 0 ? (
                  <View style={styles.table}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.th, styles.colFecha]}>Fecha</Text>
                      <Text style={[styles.th, styles.colTipo]}>Tipo</Text>
                      <Text style={[styles.th, styles.colMedio]}>Medio</Text>
                      <Text style={[styles.th, styles.colAsunto]}>Asunto</Text>
                      <Text style={[styles.th, styles.colEstatus]}>Estatus</Text>
                    </View>

                    {follows.map((item, fIdx) => (
                      <View key={item._id || fIdx} style={styles.tableRow} wrap={false}>
                        <Text style={[styles.td, styles.colFecha]}>
                          {item.fechaSeguimiento ? new Date(item.fechaSeguimiento).toLocaleDateString('es-MX') : 'N/A'}
                        </Text>
                        <Text style={[styles.td, styles.colTipo]}>{item.tipoSeguimiento || 'N/A'}</Text>
                        <Text style={[styles.td, styles.colMedio]}>{item.medioAtencion || 'N/A'}</Text>
                        <Text style={[styles.td, styles.colAsunto]}>{item.asunto || 'N/A'}</Text>
                        <Text style={[styles.td, styles.colEstatus]}>{item.estatus || 'N/A'}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={{ fontSize: 7, color: '#64748b', marginTop: 2 }}>
                    No hay registros de seguimiento para esta empresa.
                  </Text>
                )}
              </View>
            )}

            {/* PIE DE PÁGINA */}
            <View style={styles.footer} fixed>
              <Text>Ficha Técnica Empresarial — Impreso el {fechaImpresion}</Text>
              <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
            </View>

          </Page>
        );
      })}
    </Document>
  );
};