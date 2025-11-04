# Dashboard 3PL - Sistema de Monitoreo de KPIs Logísticos

## Descripción del Proyecto

Dashboard web completo para gestión y monitoreo de Indicadores Clave de Rendimiento (KPIs) en un entorno de Logística de Terceros (3PL). Proporciona capacidades de dashboard en tiempo real con control de acceso basado en roles, permitiendo a administradores y clientes ver métricas de rendimiento, recibir alertas y generar reportes.

## Tecnologías Utilizadas

### Frontend
- **Framework**: React 18 con TypeScript
- **Build Tool**: Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Estado**: TanStack Query (React Query)
- **Routing**: Wouter
- **Formularios**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js + Express.js
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL con Drizzle ORM
- **Autenticación**: JWT + bcrypt
- **Email**: Nodemailer

## Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- PostgreSQL database
- npm o yarn

### Variables de Entorno Requeridas
```env
DATABASE_URL=postgresql://usuario:password@host:puerto/database
JWT_SECRET=tu_jwt_secret_aqui
PGHOST=tu_host
PGPORT=5432
PGUSER=tu_usuario
PGPASSWORD=tu_password
PGDATABASE=tu_database
```

### Instalación
```bash
# Clonar repositorio
git clone [URL_DEL_REPOSITORIO]
cd dashboard-3pl

# Instalar dependencias
npm install

# Configurar base de datos
npm run db:push

# Iniciar en desarrollo
npm run dev
```

## Estructura del Proyecto

```
├── client/               # Frontend React
│   ├── src/
│   │   ├── components/   # Componentes UI
│   │   ├── hooks/        # React hooks personalizados
│   │   ├── pages/        # Páginas de la aplicación
│   │   └── lib/          # Utilidades
├── server/               # Backend Express
│   ├── routes.ts         # Rutas API
│   ├── storage.ts        # Capa de datos
│   └── services/         # Servicios de negocio
├── shared/               # Código compartido
│   └── schema.ts         # Esquemas de base de datos
└── README.md
```

## KPIs Implementados

1. **DOH (Días On Hand)** - Días de inventario disponible
2. **DAMAGES (Recepciones con Daños)** - Porcentaje de recepciones dañadas
3. **IRA (Inventory Record Accuracy)** - Precisión de registros de inventario
4. **D2S (Dock-to-Stock)** - Tiempo desde muelle hasta almacenamiento
5. **OTD (Despachos On Time)** - Entregas a tiempo
6. **PICKING (Exactitud Picking)** - Precisión en picking
7. **LEADTIME (Lead Time Interno)** - Tiempo interno de procesamiento
8. **READYOT (Órdenes Listas a Tiempo)** - Órdenes preparadas a tiempo
9. **PRODUCTIVITY (Productividad)** - Unidades procesadas por hora
10. **OTIF (On Time In Full)** - Entregas completas y a tiempo

## Funcionalidades Principales

### Autenticación y Roles
- Sistema JWT con roles de admin y cliente
- Control de acceso granular por funcionalidad
- Gestión de usuarios (solo admin)

### Dashboard en Tiempo Real
- 10 KPIs con actualizaciones automáticas
- Gráficos de tendencia y distribución
- Filtros por fecha, cliente y proveedor
- Vista detallada con análisis expandible

### Sistema de Alertas
- Umbrales configurables por KPI
- Notificaciones en tiempo real
- Alertas por email (configurable)
- Panel de gestión de alertas

### Exportación y Reportes
- Exportación individual de KPIs
- Reportes completos en CSV/Excel
- Filtros avanzados para reportes
- Datos detallados a nivel SKU

## Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo

# Base de datos
npm run db:push          # Actualizar esquema de base de datos
npm run db:studio        # Abrir Drizzle Studio (opcional)

# Producción
npm run build            # Build para producción
npm start                # Iniciar servidor de producción
```

## Credenciales de Prueba

**Usuario Administrador:**
- Email: `admin@3pldashboard.com`
- Password: `password123`

**Usuario Cliente:**
- Email: `ops@amazon.com`
- Password: `password123`

## API Endpoints

### Autenticación
- `POST /api/v1/auth/login` - Iniciar sesión
- `GET /api/v1/auth/me` - Obtener usuario actual

### KPIs
- `GET /api/v1/kpis/overview` - Resumen de KPIs
- `GET /api/v1/kpis/:code/detail` - Detalle de KPI específico
- `GET /api/v1/kpis/:code/export` - Exportar datos de KPI

### Usuarios (Admin only)
- `GET /api/v1/users` - Listar usuarios
- `POST /api/v1/users` - Crear usuario
- `PUT /api/v1/users/:id` - Actualizar usuario
- `DELETE /api/v1/users/:id` - Eliminar usuario

### Alertas
- `GET /api/v1/alerts` - Obtener alertas
- `PUT /api/v1/alerts/config` - Configurar umbrales

## Estado del Proyecto

**Versión**: 1.0.0  
**Estado**: Listo para Producción  
**Última Actualización**: Junio 2025

### Funcionalidades Completadas
- ✅ Todos los 10 KPIs implementados con UX completa
- ✅ Sistema de autenticación y roles
- ✅ Dashboard responsive
- ✅ Sistema de alertas
- ✅ Gestión de usuarios
- ✅ Exportación de datos
- ✅ Base de datos poblada con datos realistas

## Soporte y Documentación

Para información técnica detallada, consultar `replit.md` que contiene:
- Arquitectura completa del sistema
- Historial de cambios y mejoras
- Especificaciones técnicas de cada KPI
- Guías de deployment

## Contribución

Para hacer cambios al proyecto:
1. Crear rama feature desde main
2. Implementar cambios
3. Ejecutar pruebas
4. Crear Pull Request

## Licencia

Proyecto propietario - Dashboard 3PL System