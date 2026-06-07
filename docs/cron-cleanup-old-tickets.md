# Limpieza Automática de Tickets Antiguos (Cron Job)

Este documento describe el funcionamiento, seguridad y configuración de la tarea programada para limpiar tickets antiguos del sistema.

## ¿Qué hace?

El endpoint de limpieza busca todos los tickets cuya fecha de creación (`createdAt`) sea superior a 1 año en el pasado y los elimina de la base de datos y de Supabase Storage de manera segura.

El proceso de eliminación se realiza en el siguiente orden para mantener la integridad referencial y evitar dejar archivos huérfanos:
1. Obtiene las rutas de archivo (`filePath`) de todos los archivos adjuntos asociados a los tickets a eliminar.
2. Intenta borrar dichos archivos del bucket privado `attachments` en **Supabase Storage** (usando el cliente administrador con Service Role).
3. Si la eliminación en Storage falla, se registra el error en consola de manera segura sin exponer secretos, pero se continúa con la base de datos.
4. Elimina en cascada y en orden seguro dentro de una transacción de base de datos de Prisma:
   - Adjuntos asociados (`TicketAttachment`)
   - Comentarios asociados (`TicketComment`)
   - Historial asociado (`TicketHistory`)
   - Tickets principales (`Ticket`)

## Endpoint

* **Ruta:** `/api/cron/cleanup-old-tickets`
* **Método:** `GET`
* **Frecuencia Recomendada:** Diaria o Semanal.

## Seguridad

El endpoint está protegido mediante un token de portador (`Bearer Token`) validado contra la variable de entorno `CRON_SECRET`.

### Cabecera Requerida

```http
Authorization: Bearer <CRON_SECRET>
```

Si la cabecera `Authorization` no coincide exactamente con `Bearer ${process.env.CRON_SECRET}`, o si la variable de entorno `CRON_SECRET` no está configurada, el servidor responderá con un estado `401 Unauthorized` bloqueando la ejecución.

## Configuración en Vercel

Para ejecutar esta tarea automáticamente de forma programada en Vercel, siga estos pasos:

### 1. Definir Variable de Entorno
En el panel del proyecto en Vercel:
* Vaya a **Settings** > **Environment Variables**.
* Agregue una nueva variable llamada `CRON_SECRET` con un valor seguro de tipo contraseña/token (ej. un hash aleatorio generado con `openssl rand -hex 32`).

### 2. Configurar `vercel.json`
Cree o modifique un archivo `vercel.json` en la raíz de su proyecto con la definición del cron job:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-old-tickets",
      "schedule": "0 2 * * *"
    }
  ]
}
```

*Nota: La expresión cron `"0 2 * * *"` ejecutará la limpieza diariamente a las 2:00 AM UTC.*

Para configurar una frecuencia semanal (por ejemplo, todos los domingos a las 3:00 AM UTC):
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-old-tickets",
      "schedule": "0 3 * * 0"
    }
  ]
}
```

### 3. Despliegue (`Redeploy`)
Suba el archivo `vercel.json` y la variable de entorno a su repositorio de Git. Al desplegar a producción en Vercel, la plataforma registrará el cron job automáticamente y comenzará a invocar el endpoint según el horario definido, enviando de forma automática el header de autorización `Authorization: Bearer ...` con el valor de la variable `CRON_SECRET`.
