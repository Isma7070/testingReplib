# Instrucciones de Configuración - Dashboard 3PL

## Para el Equipo de QA/Desarrollo

### 1. Clonar y Configurar el Proyecto

```bash
# Clonar el repositorio
git clone [URL_DEL_REPOSITORIO]
cd dashboard-3pl

# Instalar dependencias
npm install
```

### 2. Configurar Base de Datos PostgreSQL

**Opción A: Usar Neon Database (Recomendado)**
1. Ir a [neon.tech](https://neon.tech) y crear cuenta gratuita
2. Crear nueva base de datos
3. Copiar connection string

**Opción B: PostgreSQL Local**
1. Instalar PostgreSQL localmente
2. Crear base de datos: `CREATE DATABASE dashboard_3pl;`

### 3. Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus valores reales
nano .env
```

**Variables requeridas:**
- `DATABASE_URL` - Connection string de PostgreSQL
- `JWT_SECRET` - String secreto para JWT (genera uno seguro)
- Variables PG* - Detalles de conexión PostgreSQL

### 4. Inicializar Base de Datos

```bash
# Aplicar schema a la base de datos
npm run db:push
```

### 5. Iniciar Aplicación

```bash
# Modo desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5000`

### 6. Credenciales de Prueba

Al ejecutar por primera vez, el sistema creará usuarios de prueba:

**Usuario Admin:**
- Email: `admin@3pldashboard.com`
- Password: `password123`

**Usuario Cliente:**
- Email: `ops@amazon.com`  
- Password: `password123`

### 7. Verificar Funcionamiento

✅ **Checklist de verificación:**
- [ ] Login funciona con ambos usuarios
- [ ] Dashboard muestra 10 KPIs con datos
- [ ] Clic en KPIs muestra detalles
- [ ] Filtros OTIF funcionan (Todos, Tardío, Incompleto, Ambos)
- [ ] Admin puede gestionar usuarios
- [ ] Sistema de alertas muestra notificaciones
- [ ] Exportación de datos funciona

### 8. Comandos Útiles

```bash
# Reiniciar base de datos (elimina todos los datos)
npm run db:push

# Build para producción
npm run build

# Iniciar servidor de producción
npm start
```

### 9. Estructura de Archivos Importantes

- `replit.md` - Documentación completa del proyecto
- `shared/schema.ts` - Esquema de base de datos
- `server/storage.ts` - Lógica de datos y KPIs
- `client/src/components/kpi-modal.tsx` - Componente principal de KPIs

### 10. Troubleshooting

**Error de conexión a DB:**
- Verificar DATABASE_URL en .env
- Confirmar que base de datos existe
- Verificar firewall/acceso de red

**KPIs sin datos:**
- Ejecutar `npm run db:push` nuevamente
- Verificar logs en consola por errores

**Build failures:**
- Ejecutar `npm install` nuevamente
- Verificar versión de Node.js (requiere 18+)

### 11. Para QA Avanzado

**Testing de API:**
```bash
# Login y obtener token
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@3pldashboard.com", "password": "password123"}'

# Usar token para consultar KPIs
curl -H "Authorization: Bearer [TOKEN]" \
  http://localhost:5000/api/v1/kpis/overview
```

**Logs importantes:**
- Errores de base de datos aparecen en consola
- Logs de Express muestran requests API
- Errores de frontend en DevTools del navegador

### 12. Contacto

Para preguntas técnicas o problemas durante setup, consultar:
- `README.md` - Información general
- `replit.md` - Documentación técnica completa
- Issues en el repositorio GitHub