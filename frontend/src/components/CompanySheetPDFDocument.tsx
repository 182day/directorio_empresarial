// src/components/CompanySheetPDFDocument.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { type CompanyFormData } from '../interfaces/company.interface';

interface CompanySheetProps {
  company?: CompanyFormData;
  companies?: CompanyFormData[];
}

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 8,
    color: '#64748b',
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
    minHeight: 22,
  },
  tableHeader: {
    backgroundColor: '#1e3a8a',
  },
  headerText: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
  },
  colName: { width: '28%', padding: 4 },
  colRfc: { width: '16%', padding: 4 },
  colLocation: { width: '26%', padding: 4 },
  colSize: { width: '16%', padding: 4 },
  colStatus: { width: '14%', padding: 4, textAlign: 'center' },
  badgeActive: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 2,
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
  },
  badgeInactive: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 2,
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
  },
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    right: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#94a3b8',
  },
});

export const CompanySheetPDFDocument: React.FC<CompanySheetProps> = ({ company, companies }) => {
  const targetCompanies = companies && companies.length > 0 ? companies : company ? [company] : [];

  const fechaImpresion = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* ENCABEZADO */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Reporte de Empresas (Listado Tabular)</Text>
            <Text style={styles.subtitle}>Directorio Empresarial — Emitido el {fechaImpresion}</Text>
          </View>
          <Text style={{ fontSize: 8, color: '#64748b' }}>
            Total de registros: {targetCompanies.length}
          </Text>
        </View>

        {/* TABLA DE EMPRESAS */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={styles.colName}>
              <Text style={styles.headerText}>EMPRESA / RAZÓN SOCIAL</Text>
            </View>
            <View style={styles.colRfc}>
              <Text style={styles.headerText}>RFC</Text>
            </View>
            <View style={styles.colLocation}>
              <Text style={styles.headerText}>UBICACIÓN</Text>
            </View>
            <View style={styles.colSize}>
              <Text style={styles.headerText}>TAMAÑO</Text>
            </View>
            <View style={styles.colStatus}>
              <Text style={styles.headerText}>ESTATUS</Text>
            </View>
          </View>

          {targetCompanies.map((comp, idx) => (
            <View
              key={comp._id || idx}
              style={[
                styles.tableRow,
                { backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' },
              ]}
            >
              <View style={styles.colName}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8 }}>
                  {comp.nombreComercial || 'N/A'}
                </Text>
                <Text style={{ fontSize: 7, color: '#64748b' }}>
                  {comp.razonSocial || 'Sin razón social'}
                </Text>
              </View>
              <View style={styles.colRfc}>
                <Text>{comp.rfc || 'N/A'}</Text>
              </View>
              <View style={styles.colLocation}>
                <Text>
                  {[comp.ubicacion?.municipio, comp.ubicacion?.estado]
                    .filter(Boolean)
                    .join(', ') || 'N/A'}
                </Text>
              </View>
              <View style={styles.colSize}>
                <Text>{comp.tamanoEmpresa || 'N/A'}</Text>
              </View>
              <View style={styles.colStatus}>
                <Text style={comp.activa ? styles.badgeActive : styles.badgeInactive}>
                  {comp.activa ? 'ACTIVO' : 'INACTIVO'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* PIE DE PÁGINA */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Reporte generado desde el Sistema de Directorio Empresarial</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
};