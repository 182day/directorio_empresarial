# 🏢 Directorio Empresarial, GeoMap & Panel de Gestión con IA (Full Stack)

<div align="center">

  <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/React--Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="React Leaflet" />
  <img src="https://img.shields.io/badge/Zustand-20232A?style=for-the-badge&logo=redux&logoColor=white" alt="Zustand" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white" alt="Gemini" />

</div>

<br/>

Aplicación web **Full Stack** modular diseñada para la consulta pública, gestión administrativa, seguimiento institucional, auditoría de eventos, generación de reportes avanzados (fichas técnicas en PDF y reportes tabulares en Excel), análisis geográfico e inteligencia de negocios de un directorio empresarial. Cuenta con un panel administrativo seguro con control de acceso basado en roles (JWT), gestión de estado global optimizada y soporte completo para modo claro y oscuro. Además incorpora un **Asistente Virtual con IA (Gemini / Groq)**, **mapas interactivos con capas GeoJSON** entre otras funcionalidades.

---

## ✨ Características Principales

- 🔍 **Directorio Público e Interactivo:** Búsqueda en tiempo real y filtrado multidimensional por sectores industriales, ubicaciones geográficas, certificaciones y tipos de operaciones.
- 🗺️ **Mapeo Geográfico Avanzado (GIS / GeoJSON):** Visualización espacial de empresas e infraestructura regional con filtros por capas geográficas (AGEB, conectividad, agua, localidades y municipios).
- 🤖 **Asistente Virtual con IA (Gemini & Groq):** Chatbot inteligente (`AIChatWidget`) integrado para realizar consultas en lenguaje natural sobre el catálogo de empresas y obtener diagnósticos estratégicos.
- ⚡ **Gestión de Estado Centralizada (Zustand):** Hidratación global de datos para eliminar peticiones HTTP redundantes y mejorar la velocidad de respuesta en la interfaz de usuario.
- 🛡️ **Autenticación y Seguridad Robustas:** Control de acceso basado en roles (JWT), contraseñas encriptadas con `bcrypt`, validación estricta de payloads y middleware personalizado para manejo de archivos e imágenes protegidas (`ProtectedImage`).
- 📥 **Importación y Optimización de Archivos:** Carga masiva de empresas desde Excel (`CompanyImportModal`) y procesamiento automático de imágenes con compresión y formateo.
- 📝 **Bitácora de Auditoría en Tiempo Real:** Registro automático e inmutable de acciones del sistema (creación, edición, eliminación y autenticación) rastreando usuario, IP del cliente y marcas de tiempo.
- 📊 **Seguimiento y Métricas Dinámicas:** Módulo especializado para el monitoreo de empresas, seguimiento de compromisos y visualización gráfica interactiva de indicadores clave.
- 📄 **Generación de Documentos y Reportes:**
  - Fichas técnicas individuales y catálogos masivos en **PDF** en el cliente mediante `@react-pdf/renderer`.
  - Exportación de listados estructurados a **Excel** usando `exceljs`.
- 🎨 **Interfaz Adaptativa & Modo Oscuro/Claro:** Sistema de diseño responsivo basado en Tailwind CSS y sincronizado mediante Context API.

---

## 📂 Arquitectura del Proyecto

Este proyecto está estructurado como un monorepo dividido en dos áreas principales:

```text
catalogo_empresas/
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── package-lock.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── uploads/                         # Directorio para archivos temporales / cargados
│   │   └── .gitkeep
│   └── src/
│       ├── index.ts                     # Punto de entrada del servidor Express
│       ├── assets/                      # Recursos estáticos del servidor
│       │   └── empresas/
│       │       └── .gitkeep
│       ├── config/
│       │   └── db.ts                    # Conexión a MongoDB con Mongoose
│       ├── controllers/                 # Lógica de negocio API REST
│       │   ├── aiControllerGemini.ts    # Controlador de IA con Google Gemini
│       │   ├── aiControllerGroq.ts      # Controlador de IA con Groq
│       │   ├── auditLogController.ts    # Controlador de logs de auditoría
│       │   ├── authController.ts        # Controlador de autenticación y JWT
│       │   ├── companyController.ts     # CRUD y gestión de empresas
│       │   └── userController.ts        # Gestión de usuarios del sistema
│       ├── middlewares/                 # Middlewares de Express
│       │   ├── authMiddleware.ts        # Verificación de Token y Roles
│       │   ├── errorMiddleware.ts       # Manejador global de errores
│       │   ├── uploadExcelMiddleware.ts # Procesamiento de archivos Excel
│       │   ├── uploadMiddleware.ts      # Procesamiento de imágenes y documentos
│       │   └── validators/              # Reglas de validación
│       │       ├── companyValidator.ts
│       │       ├── documentValidator.ts
│       │       ├── followValidator.ts
│       │       └── userValidator.ts
│       ├── models/                      # Modelos Mongoose con TypeScript
│       │   ├── AuditLog.ts
│       │   ├── Company.ts
│       │   ├── CompanyFollowUp.ts
│       │   └── User.ts
│       ├── routes/                      # Definición de rutas y endpoints
│       │   ├── aiRoutes.ts
│       │   ├── auditLogRoutes.ts
│       │   ├── authRoutes.ts
│       │   ├── companyRoutes.ts
│       │   └── userRoutes.ts
│       ├── scripts/
│       │   ├── diagnostico-groq.ts      # Script de diagnóstico para motor de IA
│       │   └── importExcel.ts           # Importación masiva desde archivos Excel
│       ├── services/
│       │   └── aiTools.ts               # Herramientas y Helpers para modelos de IA
│       └── utils/
│           ├── getClientIp.ts           # Extracción de IP para auditoría
│           ├── imageOptimizer.ts        # Optimización y compresión de imágenes
│           ├── processTags.ts           # Normalización de etiquetas/tags
│           └── matchers/                # Algoritmos y catálogos de mapeo para importación
│               ├── apoyosMatcher.ts
│               ├── certificacionesMatcher.ts
│               ├── countryMatcher.ts
│               ├── locationMatcher.ts
│               ├── principalSectorMatcher.ts
│               ├── sectoresMatcher.ts
│               └── data/
│                   ├── companyCatalog.ts
│                   ├── countryCatalog.ts
│                   └── locationCatalog.ts
│
├── frontend/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── public/
│   │   └── icono.svg
│   └── src/
│       ├── main.tsx                     # Inicialización de React
│       ├── index.css                    # Estilos globales y Tailwind CSS
│       ├── Router.tsx                   # Rutas públicas y protegidas
│       ├── api/
│       │   └── axios.ts                 # Cliente Axios configurado con interceptores JWT
│       ├── assets/
│       ├── components/                  # Componentes reutilizables de UI
│       │   ├── AIChatWidget.tsx         # Widget flotante de Chat con IA
│       │   ├── CompaniesFilterDrawer.tsx
│       │   ├── CompaniesFollowGraphics.tsx
│       │   ├── CompaniesFollowSheetExcel.ts
│       │   ├── CompaniesFollowSheetPDFDocument.tsx
│       │   ├── CompaniesGraphics.tsx
│       │   ├── CompaniesPDFDocument.tsx
│       │   ├── CompaniesSheetExcel.ts
│       │   ├── CompanyDetailsModal.tsx  # Componente para ver los detalles e información de la empresa
│       │   ├── CompanyFollowForm.tsx    # Formulario de registro de seguimiento de empresas
│       │   ├── CompanyForm.tsx          # Formulario de registro de empresas
│       │   ├── CompanyImportModal.tsx   # Modal para importación masiva en Excel
│       │   ├── CompanySheetPDFDocument.tsx
│       │   ├── LayerFilterMap.tsx       # Filtro de capas cartográficas
│       │   ├── Pagination.tsx           # Controles de paginación y navegación de listas
│       │   ├── ProtectedImage.tsx       # Componente de imagen con protección de acceso
│       │   ├── ProtectedRoute.tsx       # Componente de protección de acceso a rutas
│       │   ├── SectorCheckboxGroup.tsx
│       │   ├── Sidebar.tsx              # Menú de navegación del sitio
│       │   └── UserForm.tsx             # Formulario de registro de usuarios
│       ├── context/
│       │   ├── AuthContext.tsx
│       │   └── ThemeContext.tsx
│       ├── data/                        # Catálogos estáticos y capas de mapas
│       │   ├── companyCatalog.ts
│       │   ├── countryCatalog.ts
│       │   ├── followCatalog.ts
│       │   ├── locationCatalog.ts
│       │   ├── mapCatalog.ts
│       │   └── layers/                  # Capas GeoJSON para renderizado espacial
│       │       ├── .gitkeep
│       │       ├── ageb.json
│       │       ├── agua.json
│       │       ├── calles.json
│       │       ├── carreteras.json
│       │       ├── estado.json
│       │       ├── localidades.json
│       │       ├── municipios.json
│       │       ├── republica.json
│       │       └── sip.json
│       ├── helpers/
│       │   └── documentHelper.ts
│       ├── interfaces/                  # Contratos de tipos estrictos en TypeScript
│       │   ├── company.interface.ts
│       │   ├── follow.interface.ts
│       │   └── user.interface.ts
│       ├── layouts/
│       │   └── AdminLayout.tsx
│       ├── pages/                       # Vistas principales de la app
│       │   ├── AuditLogPage.tsx
│       │   ├── CompaniesFollowPage.tsx
│       │   ├── CompaniesPage.tsx
│       │   ├── Directory.tsx
│       │   ├── Login.tsx
│       │   ├── MapPage.tsx              # Vista del mapa interactivo
│       │   ├── MyAccountPage.tsx
│       │   └── UsersPage.tsx
│       ├── stores/                      # Estado global con Zustand
│       │   ├── useCompanyStore.ts
│       │   ├── useMapCompaniesStore.ts  # Estado para el mapa y capas cartográficas
│       │   └── useUserStore.ts
│       └── utils/
│           └── formUtils.ts
└── README.md
```

---

## 🛠️ Stack Tecnológico

### 🖥️ Frontend
* **Core:** React 18, TypeScript, Vite
* **Enrutamiento:** React Router DOM
* **Gestión de Estado:** Zustand, React Context API (`AuthContext`, `ThemeContext`)
* **GIS & Mapas:** Integración de archivos GeoJSON/JSON para análisis espacial
* **Estilos & UI:** Tailwind CSS, Lucide React (Iconografía), Sonner (Toasts)
* **Inteligencia Artificial:** Widget interactivo de chat conectado a API REST
* **Generación de Reportes:** `@react-pdf/renderer` (Documentos PDF), `exceljs` (Hojas de cálculo Excel)
* **Peticiones HTTP:** Axios con interceptores de Token JWT

### ⚙️ Backend
* **Entorno de Ejecución:** Node.js
* **Framework:** Express.js con TypeScript (`ts-node`, `nodemon`)
* **Base de Datos:** MongoDB con Mongoose ODM
* **Inteligencia Artificial:** Integración de Google Gemini SDK / Groq SDK
* **Seguridad & Autenticación:** JSON Web Tokens (JWT), Bcryptjs, Express Validator
* **Archivos & Procesamiento:** Multer para upload de archivos, optimización de imágenes
* **Procesamiento de Datos:** XLSX / ExcelJS para scripts de importación y exportación

---

## 🚀 Guía de Instalación y Ejecución Local

Sigue estos pasos para poner en marcha el proyecto en tu máquina de desarrollo:

### Prerrequisitos
Asegúrate de contar con las siguientes herramientas instaladas:
* **Node.js** (v18.0.0 o superior)
* **npm** o **yarn**
* Instancia local de **MongoDB** o credenciales de **MongoDB Atlas**

---

### 1. Clonar el repositorio
```bash
git clone [https://github.com/tu-usuario/catalogo_empresas.git](https://github.com/tu-usuario/catalogo_empresas.git)
cd catalogo_empresas

### 2. Configurar y Ejecutar el Backend

```bash
# Entrar a la carpeta del servidor
cd backend

# Instalar dependencias
npm install

# Crear el archivo de variables de entorno
cp .env.example .env
```

Edita el archivo .env en backend/ con la siguiente configuración:
```bash
PORT=5000
MONGO_URI=mongodb://localhost:27017/catalogo_empresas
JWT_SECRET=tu_clave_secreta_super_segura
GEMINI_API_KEY=tu_api_key_de_gemini
GROQ_API_KEY=tu_api_key_de_groq
```

```bash
# Iniciar el backend en modo desarrollo:
npm run dev
```

### 3. Configurar y Ejecutar el Frontend

Abre una **nueva terminal** y navega a la carpeta del frontend:

```bash
# Entrar a la carpeta del cliente
cd frontend

# Instalar dependencias
npm install

# Crear el archivo de variables de entorno
cp .env.example .env
```

Edita el archivo .env en frontend/ para conectar con el backend:
```bash
VITE_API_URL=http://localhost:5000/api
VITE_API_KEY=TU_API_KEY_REACT_LEAFLET
```

```bash
# Iniciar el servidor de desarrollo del frontend:
npm run dev
```

Accede a la aplicación desde tu navegador en:
```bash
http://localhost:5173
```

---

## 💡 Decisiones Técnicas Destacadas

1. **Integración de Asistente Virtual IA:**
   Desarrollo de controladores dedicados (`aiControllerGemini.ts`, `aiControllerGroq.ts`) que permiten realizar consultas avanzadas y diagnósticos automáticos sobre el catálogo empresarial en tiempo real.

2. **Georreferenciación y Capas Cartográficas:**
   Mapeo interactivo basado en datos GeoJSON (`MapPage.tsx`, `LayerFilterMap.tsx`) respaldado por un store especializado (`useMapCompaniesStore.ts`) para optimizar el renderizado espacial de infraestructura y límites geográficos.

3. **Arquitectura Limpia y Tipado Estricto:**
   Modelado de contratos con TypeScript compartidos conceptualmente entre el cliente y el servidor, garantizando consistencia en las peticiones HTTP y previniendo errores en tiempo de desarrollo.

4. **Carga y Filtrado Eficiente:**
   Implementación de **Zustand** como gestor de estado global para reducir las peticiones al servidor, ofreciendo búsquedas inmediatas y un mejor rendimiento.

5. **Auditoría Transparente e Inmutable:**
   Integración de middleware que registra automáticamente cada acción crítica realizada por un usuario (crear, editar, eliminar o autenticarse), capturando su dirección IP, usuario responsable y fecha exacta en MongoDB.

6. **Generación de Reportes Client-Side:**
   Creación de fichas técnicas y reportes analíticos generados dinámicamente en el cliente mediante `@react-pdf/renderer` y `exceljs`, aliviando la carga de procesamiento en el servidor backend.

7. **Tratamiento Eficiente de Multimedia y Documentos:**
   Importación de archivos Excel con validación de estructuras en servidor (`uploadExcelMiddleware.ts`), junto con un servicio de optimización de imágenes (`imageOptimizer.ts`) para asegurar altos estándares de rendimiento..

---

##  📬 Contacto

¿Te interesa mi perfil o quieres discutir sobre este proyecto? ¡Hablemos!

* 💼 **LinkedIn:** [Fernando Contreras de la Garza](https://www.linkedin.com/in/fernando-contreras-de-la-garza-11a0a1242/)
* ✉️ **Email:** fers.delagarza@gmail.com
* 🌐 **Portafolio:** [fer.agc.com.mx](https://fer.agc.com.mx)

---
<div align="center">
  Hecho con 💙 y mucho café por Fernando Contreras de la Garza
</div>
