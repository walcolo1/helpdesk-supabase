# SKILL: Reglas Base del Proyecto

## Cuándo usar esta skill

Activar **siempre** como punto de partida antes de cualquier tarea de desarrollo. Define las restricciones globales e inamovibles del proyecto.

---

## Contexto

Este es un sistema ITSM (IT Service Management) corporativo construido sobre Next.js 14 y Supabase (PostgreSQL). El sistema gestiona tickets de soporte, un catálogo de servicios jerárquico y usuarios con roles diferenciados.

**Stack tecnológico obligatorio:**
- **Frontend**: Next.js 14 (App Router)
- **Backend/DB**: Supabase (PostgreSQL 15+)
- **Lenguaje**: TypeScript (strict mode)
- **ORM/Query**: Supabase JS Client (`@supabase/supabase-js`)
- **Estilos**: Vanilla CSS o CSS Modules (sin Tailwind en Fase 1)

---

## Instrucciones

### Reglas de código

1. **TypeScript strict**: Todo archivo `.ts` y `.tsx` debe compilar sin errores con `strict: true`.
2. **No `any` implícito**: Tipar explícitamente todas las respuestas de Supabase usando los tipos generados (`database.types.ts`).
3. **Variables de entorno**: Nunca hardcodear URLs, keys o secretos. Usar `process.env.NEXT_PUBLIC_*` para públicos y `process.env.*` para privados.
4. **Manejo de errores**: Toda llamada a Supabase debe manejar el objeto `{ data, error }`. Nunca ignorar el error.
5. **Server Components por defecto**: En Next.js 14, usar Server Components salvo que se necesite estado cliente (`'use client'`).

### Reglas de base de datos

1. **SSOT**: `backend/database/schema.sql` es el plano maestro. Toda migración parte de ahí.
2. **Migraciones atómicas**: Cada cambio al esquema es una migración independiente con nombre descriptivo.
3. **Nunca modificar producción directamente**: Todo cambio pasa por migraciones versionadas.
4. **Timestamps UTC**: Todos los campos `timestamptz` almacenan en UTC.

### Reglas de seguridad

1. **RLS habilitado siempre**: Ninguna tabla pública sin política RLS.
2. **Principio de mínimo privilegio**: Los roles tienen el mínimo de permisos necesario.
3. **Validación dual**: Validar en frontend para UX, validar en servidor/DB para seguridad real.
4. **Service Role Key**: Solo usarse en contextos de servidor (Edge Functions, API Routes). Nunca en cliente.

---

## Restricciones

- ❌ No implementar autenticación UI en Fase 1.
- ❌ No agregar dependencias npm sin evaluar su impacto en bundle size.
- ❌ No usar `supabase.from().select('*')` en producción sin columnas específicas.
- ❌ No exponer el `service_role` key en variables `NEXT_PUBLIC_*`.
- ❌ No crear tablas sin RLS habilitado.
