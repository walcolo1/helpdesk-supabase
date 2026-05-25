# Cierre Técnico: Help Desk / ITSM MVP v1.0

Este documento certifica el estado técnico del Producto Mínimo Viable (MVP) para la versión 1.0. Se han estabilizado todas las funcionalidades *core* solicitadas para la gestión de tickets, catálogo de servicios, administración de usuarios y centro de recursos corporativo.

## 1. Módulos Implementados

1. **Autenticación (Auth.js)**: Control de sesiones JWT, cifrado de contraseñas con bcrypt, y middleware de protección de rutas.
2. **Dashboard**: Panel principal con métricas dinámicas (KPIs) calculadas por rol y tabla de actividad reciente.
3. **Gestión de Usuarios**: ABM (Alta, Baja, Modificación) avanzado. Desactivación de cuentas (Soft-delete), reseteo de claves y expiración de acceso.
4. **Tickets**: Sistema completo de soporte técnico. Creación, asignación a agentes, control de prioridades/estados y sistema de comentarios internos.
5. **Catálogo de Servicios**: Organización jerárquica de Categorías y Servicios para simplificar la creación de tickets y derivación.
6. **Centro de Recursos**: Gestor de documentos compartidos con almacenamiento físico para políticas y plantillas corporativas.

## 2. Rutas Disponibles

| Ruta | Nivel de Acceso | Descripción |
|---|---|---|
| `/login` | Público | Pantalla de ingreso. |
| `/register` | Público | Autoregistro inicial (si aplica). |
| `/dashboard` | Autenticado | Panel operativo principal. |
| `/dashboard/profile` | Autenticado | Perfil personal y gestión de contraseña. |
| `/dashboard/tickets` | Autenticado | Cola de tickets. Filtrada según rol. |
| `/dashboard/tickets/new` | Autenticado | Formulario para creación de un ticket. |
| `/dashboard/tickets/[id]` | Autenticado | Vista detalle, comentarios y timeline. |
| `/dashboard/catalog` | Admin | Gestión de categorías y servicios. |
| `/dashboard/users` | Admin | Panel de administración de cuentas de usuario. |
| `/dashboard/resources` | Autenticado | Vista pública del centro de documentos. |
| `/dashboard/resources/manage`| Admin | Panel de carga y eliminación de recursos. |

## 3. Roles y Permisos

- **Administrador (`admin`)**: Acceso ilimitado. Puede gestionar usuarios, crear recursos, editar el catálogo de servicios, y visualizar todos los tickets de la empresa.
- **Agente (`agent`)**: Vista global de tickets para atender incidentes y reasignarlos. No tiene acceso a configuración administrativa.
- **Usuario Final (`user`)**: Solo puede crear tickets propios, ver el estado de sus incidentes, y descargar documentos del Centro de Recursos.

## 4. Flujo de Autenticación

Basado en `NextAuth` / `Auth.js` (Estrategia JWT).
1. El middleware intercepta rutas bajo `/dashboard`.
2. Las credenciales se validan contra MySQL (`bcrypt.compare`).
3. Si el usuario está desactivado o la fecha actual supera su `expiresAt`, la sesión se rechaza ("Account expired").
4. El token incluye campos cruciales: `id`, `role`, `mustChangePassword`.

## 5. Flujo de Usuarios Nuevos con Clave Temporal

Diseñado para *Onboarding* seguro por parte de RRHH o TI:
1. El administrador asigna una contraseña temporal en la creación.
2. El sistema aplica el hash a esta contraseña e inyecta `mustChangePassword = true` en base de datos.
3. El usuario inicia sesión. Auth.js valida el hash temporal exitosamente.
4. El middleware detecta `mustChangePassword === true` y bloquea el acceso a `/dashboard`, forzando un `redirect` a `/dashboard/profile?mustChange=1`.
5. El usuario debe colocar su clave temporal, crear una nueva, e inmediatamente es redirigido a `/dashboard`, desactivándose la bandera obligatoria.

## 6. Flujo de Tickets

1. El solicitante elige un Servicio del catálogo y describe su problema.
2. El ticket ingresa en estado `open`.
3. Un Agente o Admin toma el ticket, pasando a `in_progress`.
4. El sistema mantiene una bitácora en la vista detalle (Comentarios y cambios de estado).
5. Tras resolución, el ticket pasa a `resolved` o `closed`.

## 7. Catálogo de Servicios

- Modelo relacional anidado: `Category` (1 -> N) `Service`.
- Evita borrados inseguros: Si una categoría o servicio tiene incidentes o relaciones activas vinculadas, el borrado en cascada previene fallos transaccionales y muestra errores humanizados.

## 8. Centro de Recursos

- Almacenamiento validado en `/public/uploads/resources`.
- Filtrado MIME estricto (PDF, DOCX, XLSX, etc.) y límite de 10 MB.
- Solo los administradores inyectan o eliminan documentos físicamente y de BD.

## 9. Variables de Entorno Necesarias

En `.env` / `.env.local`:
```env
# Conexión principal a MySQL
DATABASE_URL="mysql://usuario:clave@localhost:3306/helpdesk_db"

# Semilla de seguridad para JWT
AUTH_SECRET="token-ultra-secreto-generado-por-openssl"

# Integraciones (opcional si falla silenciosamente en log)
RESEND_API_KEY="re_123..."
```

## 10. Comandos para Ejecutar Localmente

```bash
# Instalar dependencias base
npm install

# Instalar dependencias añadidas para fechas
npm install date-fns

# Generar cliente de BD
npx prisma generate

# Levantar servidor en desarrollo
npm run dev
```
