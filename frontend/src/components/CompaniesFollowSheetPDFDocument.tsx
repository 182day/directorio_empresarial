// src/components/CompaniesFollowSheetPDFDocument.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { type FollowRecord } from '../interfaces/follow.interface';
import { type User } from '../interfaces/user.interface';
import { formatFechaLarga } from '../utils/formUtils';

interface FollowSheetPDFProps {
  follows: FollowRecord[];
  companyName?: string;
  user?: User | null;
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
  colCompany: { width: '20%', padding: 4 },
  colType: { width: '18%', padding: 4 },
  colSubject: { width: '32%', padding: 4 },
  colDate: { width: '18%', padding: 4 },
  colStatus: { width: '12%', padding: 4, textAlign: 'center' },
  badgeConcluido: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 2,
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
  },
  badgePendiente: {
    backgroundColor: '#fef3c7',
    color: '#b45309',
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 2,
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
  },
  badgeCancelado: {
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

export const CompaniesFollowSheetPDFDocument: React.FC<FollowSheetPDFProps> = ({
  follows,
  companyName,
  user,
}) => {
  // Validación de roles de usuario
  // @ts-ignore
  const isAdmin = user?.rol === 'admin';
  const canSeeStatus = user?.rol === 'admin' || user?.rol === 'editor';

  const fechaImpresion = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getStatusBadgeStyle = (estatus?: string) => {
    switch (estatus) {
      case 'Concluido':
      case 'Atendido':
      case 'Completado':
        return styles.badgeConcluido;
      case 'Pendiente':
      case 'En Proceso':
      case 'Nuevo':
        return styles.badgePendiente;
      case 'Cancelado':
        return styles.badgeCancelado;
      default:
        return styles.badgePendiente;
    }
  };

  return (
    <Document>
      <Page size="LETTER" orientation="landscape" style={styles.page}>
        {/* ENCABEZADO */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Reporte de Seguimientos {companyName ? `— ${companyName}` : ''}
            </Text>
            <Text style={styles.subtitle}>
              Bitácora de Atenciones — Emitido el {fechaImpresion}
            </Text>
          </View>
          <Text style={{ fontSize: 8, color: '#64748b' }}>
            Total de registros: {follows.length}
          </Text>
        </View>

        {/* TABLA DE SEGUIMIENTOS */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={styles.colCompany}>
              <Text style={styles.headerText}>EMPRESA / ATENCIÓN</Text>
            </View>
            <View style={styles.colType}>
              <Text style={styles.headerText}>TIPO / VINCULACIÓN</Text>
            </View>
            <View style={styles.colSubject}>
              <Text style={styles.headerText}>ASUNTO / DESCRIPCIÓN</Text>
            </View>
            <View style={styles.colDate}>
              <Text style={styles.headerText}>
                FECHA {canSeeStatus ? '/ REGISTRADO POR' : ''}
              </Text>
            </View>
            <View style={styles.colStatus}>
              <Text style={styles.headerText}>ESTATUS</Text>
            </View>
          </View>

          {follows.map((item, idx) => (
            <View
              key={item._id || idx}
              style={[
                styles.tableRow,
                { backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' },
              ]}
            >
              <View style={styles.colCompany}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8 }}>
                  {item.companyName || 'N/A'}
                </Text>
                <Text style={{ fontSize: 7, color: '#64748b' }}>
                  Atención: {item.atencionSeguimiento || 'Sin contacto'}
                </Text>
              </View>

              <View style={styles.colType}>
                <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                  {item.tipoSeguimiento || 'N/A'}
                </Text>
                <Text style={{ fontSize: 7, color: '#64748b' }}>
                  Medio: {item.medioAtencion || 'N/A'}
                </Text>
                <Text style={{ fontSize: 6.5, color: item.esVinculacion ? '#2563eb' : '#64748b' }}>
                  Vinculación: {item.esVinculacion ? 'Sí' : 'No'}
                </Text>
              </View>

              <View style={styles.colSubject}>
                <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                  {item.asunto || 'Sin asunto'}
                </Text>
                <Text style={{ fontSize: 7, color: '#64748b' }}>
                  {item.descripcion || ''}
                </Text>
              </View>

              <View style={styles.colDate}>
                <Text>
                  {item.fechaSeguimiento
                    ? formatFechaLarga(item.fechaSeguimiento)
                    : 'N/A'}
                </Text>
                {/* 👈 Solo visible si canSeeStatus es true */}
                {canSeeStatus && (
                  <Text style={{ fontSize: 7, color: '#64748b' }}>
                    Por: {item.usuario || 'N/A'}
                  </Text>
                )}
              </View>

              <View style={styles.colStatus}>
                <Text style={getStatusBadgeStyle(item.estatus)}>
                  {(item.estatus || 'PENDIENTE').toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* PIE DE PÁGINA */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Reporte generado desde el Sistema de Directorio Empresarial
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};