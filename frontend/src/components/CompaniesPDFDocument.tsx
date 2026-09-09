// src/components/CompaniesPDFDocument.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface Company {
    _id: string;
    nombreComercial: string;
    razonSocial: string;
    rfc: string;
    tamanoEmpresa: string;
    ubicacion: {
        estado: string;
        municipio: string;
    };
    activa: boolean;
}

interface CompaniesPDFProps {
    companies: Company[];
}

// Estilos del documento PDF
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 9,
        fontFamily: 'Helvetica',
        color: '#1e293b',
    },
    header: {
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
    },
    date: {
        fontSize: 8,
        color: '#64748b',
    },
    table: {
        width: '100%',
        marginTop: 10,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        minHeight: 22,
        alignItems: 'center',
    },
    tableHeaderRow: {
        backgroundColor: '#0f172a',
        color: '#ffffff',
        fontFamily: 'Helvetica-Bold',
    },
    colCompany: { width: '30%', paddingRight: 4 },
    colRfc: { width: '18%' },
    colLocation: { width: '27%' },
    colSize: { width: '13%' },
    colStatus: { width: '12%', textAlign: 'center' },
    headerCell: {
        padding: 5,
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
    },
    cell: {
        padding: 5,
        fontSize: 8,
    },
    subtext: {
        fontSize: 7,
        color: '#64748b',
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 8,
        color: '#94a3b8',
    },
});

export const CompaniesPDFDocument: React.FC<CompaniesPDFProps> = ({ companies }) => {
    const fechaImpresion = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* ENCABEZADO */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Reporte de Empresas</Text>
                        <Text style={styles.subtext}>Directorio Empresarial</Text>
                    </View>
                    <View>
                        <Text style={styles.date}>Fecha de impresión: {fechaImpresion}</Text>
                        <Text style={styles.date}>Total de registros: {companies.length}</Text>
                    </View>
                </View>

                {/* TABLA DE EMPRESAS */}
                <View style={styles.table}>
                    {/* Encabezados */}
                    <View style={[styles.tableRow, styles.tableHeaderRow]}>
                        <Text style={[styles.headerCell, styles.colCompany]}>Empresa / Razón Social</Text>
                        <Text style={[styles.headerCell, styles.colRfc]}>RFC</Text>
                        <Text style={[styles.headerCell, styles.colLocation]}>Ubicación</Text>
                        <Text style={[styles.headerCell, styles.colSize]}>Tamaño</Text>
                        <Text style={[styles.headerCell, styles.colStatus]}>Estatus</Text>
                    </View>

                    {/* Filas */}
                    {companies.map((company) => (
                        <View key={company._id} style={styles.tableRow} wrap={false}>
                            <View style={[styles.cell, styles.colCompany]}>
                                <Text style={{ fontFamily: 'Helvetica-Bold' }}>{company.nombreComercial}</Text>
                                <Text style={styles.subtext}>{company.razonSocial}</Text>
                            </View>
                            <Text style={[styles.cell, styles.colRfc]}>{company.rfc}</Text>
                            <Text style={[styles.cell, styles.colLocation]}>
                                {company.ubicacion?.municipio ? `${company.ubicacion.municipio}, ` : ''}
                                {company.ubicacion?.estado || 'N/A'}
                            </Text>
                            <Text style={[styles.cell, styles.colSize]}>{company.tamanoEmpresa}</Text>
                            <Text
                                style={[
                                    styles.cell,
                                    styles.colStatus,
                                    { color: company.activa ? '#15803d' : '#b91c1c' },
                                ]}
                            >
                                {company.activa ? 'Activo' : 'Inactivo'}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* PIE DE PÁGINA CON NÚMERO DE PÁGINA */}
                <Text
                    style={styles.footer}
                    render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
                    fixed
                />
            </Page>
        </Document>
    );
};