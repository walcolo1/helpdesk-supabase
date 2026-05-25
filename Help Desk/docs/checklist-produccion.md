# Checklist de Validación Manual y Riesgos antes de Producción

## Validación Manual Recomendada

Antes de dar el *Go-Live* final, se recomienda realizar pruebas cruzadas manuales con tres navegadores distintos (o pestañas de incógnito) ejecutando los tres roles (`admin`, `agent`, `user`).

- [ ] **Onboarding Admin:** Crear un `admin` de prueba, desactivarlo temporalmente y verificar que el sistema rechace el inicio de sesión.
- [ ] **Onboarding Usuario:** Crear un `user`, forzar expiración (`expiresAt` en el pasado) e intentar login. El sistema debe responder "Cuenta expirada".
- [ ] **Protección Anti-Lockout:** Intentar que el administrador se desactive a sí mismo o se quite el rol (El sistema debe impedir dejar el sistema sin al menos un admin activo).
- [ ] **Uploads:** Subir un archivo de 11 MB al centro de recursos y verificar rechazo. Subir un `.exe` e intentar saltar el filtro.
- [ ] **Casos Extremos de UI:** Crear un ticket con una descripción extremadamente larga (5000+ caracteres sin espacios) y confirmar que la tabla en `/dashboard/tickets` o el timeline no se rompen horizontalmente (Tailwind CSS word-break).
- [ ] **Protección de API:** Llamar directamente al Server Action de creación de usuarios desde una consola del navegador, teniendo iniciada una sesión de nivel `user`. Confirmar rechazo por "No autorizado".

## Riesgos y Consideraciones Pre-Producción

### 1. Sistema de Archivos Volátil (Recursos y Adjuntos)
Actualmente, los archivos se suben a `/public/uploads/resources`.
- **Riesgo:** Si el sistema se despliega en plataformas como **Vercel**, el disco es efímero. Al reiniciar el contenedor, **se perderán todos los archivos subidos**.
- **Mitigación obligatoria:** Migrar la ruta física a un proveedor de almacenamiento externo (AWS S3, Vercel Blob o Supabase Storage) antes de desplegar en Serverless.

### 2. Gestión de Correo y Resend
- **Riesgo:** Si `RESEND_API_KEY` falla, el sistema se mantiene operando mediante *best-effort* (gracias a la reciente mitigación en `actions/auth.ts`), pero el usuario no recibirá su contraseña temporal en su correo.
- **Mitigación obligatoria:** Asegurar una API Key válida y dominio verificado en la cuenta de Resend de producción para garantizar el flujo de Onboarding automatizado.

### 3. Migración y Conexión a Base de Datos
- **Riesgo:** Prisma requiere una URL de base de datos altamente concurrente o el uso de *Connection Pooling* si se despliega Serverless (ej. Prisma Accelerate o Pgbouncer).
- **Mitigación:** Asegurar que `DATABASE_URL` apunte a una base de datos cloud productiva (AWS RDS, PlanetScale, Supabase) y no a `localhost`.

### 4. Entorno Auth.js
- **Riesgo:** NextAuth necesita la URL canónica de la web para redirigir correctamente.
- **Mitigación obligatoria:** Configurar la variable `NEXTAUTH_URL="https://tu-dominio.com"` y un `AUTH_SECRET` robusto en el entorno de producción.
