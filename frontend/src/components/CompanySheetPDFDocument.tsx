// src/components/CompanySheetPDFDocument.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface Company {
    _id: string;
    nombreComercial: string;
    razonSocial: string;
    rfc: string;
    tamanoEmpresa: string;
    anioInicio: number;
    sitioWeb?: string;
    etiquetas: string[];
    ubicacion: {
        estado: string;
        municipio: string;
    };
    activa: boolean;
}

interface CompanySheetProps {
    // Acepta una sola empresa O una lista de empresas
    company?: Company;
    companies?: Company[];
}

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#1e293b',
        backgroundColor: '#ffffff',
    },
    header: {
        borderBottomWidth: 2,
        borderBottomColor: '#2563eb',
        paddingBottom: 12,
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 20,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
    },
    subtitle: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
    },
    badge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
    },
    badgeActive: {
        backgroundColor: '#dcfce7',
        color: '#15803d',
    },
    badgeInactive: {
        backgroundColor: '#fee2e2',
        color: '#b91c1c',
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: '#1e3a8a',
        backgroundColor: '#f1f5f9',
        padding: 6,
        marginTop: 15,
        marginBottom: 10,
        borderRadius: 3,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 5,
    },
    col6: {
        width: '50%',
        marginBottom: 10,
    },
    col12: {
        width: '100%',
        marginBottom: 10,
    },
    label: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    value: {
        fontSize: 10,
        color: '#0f172a',
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 4,
    },
    tag: {
        backgroundColor: '#e2e8f0',
        color: '#334155',
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 3,
        fontSize: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 8,
        color: '#94a3b8',
    },
});

export const CompanySheetPDFDocument: React.FC<CompanySheetProps> = ({ company, companies }) => {
    const fechaImpresion = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    // Normalizamos los datos a un arreglo siempre
    const targetCompanies = companies || (company ? [company] : []);

    return (
        <Document>
            {targetCompanies.map((comp) => (
                <Page key={comp._id} size="A4" style={styles.page}>
                    {/* ENCABEZADO */}
                    <View style={styles.header}>
                        <View style={{ width: '70%' }}>
                            <Text style={styles.title}>{comp.nombreComercial}</Text>
                            <Text style={styles.subtitle}>{comp.razonSocial}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#2563eb', marginBottom: 4 }}>
                                FICHA TÉCNICA
                            </Text>
                            <Text style={[styles.badge, comp.activa ? styles.badgeActive : styles.badgeInactive]}>
                                {comp.activa ? 'ESTATUS: ACTIVO' : 'ESTATUS: INACTIVO'}
                            </Text>
                        </View>
                    </View>

                    {/* SECCIÓN 1: DATOS GENERALES */}
                    <Text style={styles.sectionTitle}>1. Información General</Text>
                    <View style={styles.grid}>
                        <View style={styles.col6}>
                            <Text style={styles.label}>RFC</Text>
                            <Text style={styles.value}>{comp.rfc || 'N/A'}</Text>
                        </View>
                        <View style={styles.col6}>
                            <Text style={styles.label}>Tamaño de la Empresa</Text>
                            <Text style={styles.value}>{comp.tamanoEmpresa}</Text>
                        </View>
                        <View style={styles.col6}>
                            <Text style={styles.label}>Año de Inicio de Operaciones</Text>
                            <Text style={styles.value}>{comp.anioInicio || 'N/A'}</Text>
                        </View>
                        <View style={styles.col6}>
                            <Text style={styles.label}>Sitio Web</Text>
                            <Text style={styles.value}>{comp.sitioWeb || 'Sin registro'}</Text>
                        </View>
                    </View>

                    {/* SECCIÓN 2: UBICACIÓN */}
                    <Text style={styles.sectionTitle}>2. Ubicación Geográfica</Text>
                    <View style={styles.grid}>
                        <View style={styles.col6}>
                            <Text style={styles.label}>Estado</Text>
                            <Text style={styles.value}>{comp.ubicacion?.estado || 'N/A'}</Text>
                        </View>
                        <View style={styles.col6}>
                            <Text style={styles.label}>Municipio</Text>
                            <Text style={styles.value}>{comp.ubicacion?.municipio || 'N/A'}</Text>
                        </View>
                    </View>

                    {/* SECCIÓN 3: OPERACIONES Y ETIQUETAS */}
                    <Text style={styles.sectionTitle}>3. Operaciones y Servicios</Text>
                    <View style={styles.grid}>
                        <View style={styles.col12}>
                            <Text style={styles.label}>Etiquetas / Sectores de Operación</Text>
                            <View style={styles.tagContainer}>
                                {comp.etiquetas && comp.etiquetas.length > 0 ? (
                                    comp.etiquetas.map((tag, idx) => (
                                        <Text key={idx} style={styles.tag}>
                                            {tag}
                                        </Text>
                                    ))
                                ) : (
                                    <Text style={styles.value}>Sin etiquetas registradas</Text>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* PIE DE PÁGINA */}
                    <View style={styles.footer} fixed>
                        <Text style={styles.footerText}>Generado desde el Directorio Empresarial</Text>
                        <Text style={styles.footerText}>Fecha de emisión: {fechaImpresion}</Text>
                    </View>
                </Page>
            ))}
        </Document>
    );
};