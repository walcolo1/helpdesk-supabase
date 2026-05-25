# SKILL: Modelos de Datos

## Cuándo usar esta skill

Activar cuando se necesite:
- Crear o modificar consultas SQL / Supabase queries.
- Diseñar nuevas tablas o alterar el esquema existente.
- Entender relaciones entre entidades del sistema.
- Generar o actualizar tipos TypeScript desde el esquema.

---

## Contexto

El modelo de datos completo se encuentra en `backend/database/schema.sql`. Este documento es un resumen de referencia rápida.

**Schema principal**: `public`
**Schema de autenticación**: `auth` (gestionado por Supabase, no modificar directamente)

---

## Instrucciones

### ENUMs definidos

```sql
-- Estado del ciclo de vida de un ticket
ticket_status: pending | in_progress | resolved | closed | cancelled

-- Prioridad de atención del ticket
ticket_priority: low | medium | high | critical

-- Rol del usuario dentro del sistema
user_role: end_user | agent | admin
```

### Tablas principales

#### `public.perfiles`
- **Propósito**: Extiende `auth.users` con datos del sistema ITSM.
- **PK**: `id UUID` (referencia a `auth.users.id`)
- **Campos clave**: `nombre_completo`, `email`, `rol (user_role)`, `departamento`, `activo`
- **Relación**: `1:1` con `auth.users`
- **RLS**: Usuarios ven su propio perfil; admins ven todos.

#### `public.catalogo_servicios`
- **Propósito**: Catálogo jerárquico de servicios ofrecidos por IT.
- **PK**: `id UUID`
- **Campos clave**: `nombre`, `descripcion`, `padre_id (self-ref)`, `activo`, `sla_horas_respuesta`, `sla_horas_resolucion`
- **Relación**: Árbol recursivo (padre/hijo) mediante `padre_id → id`
- **RLS**: Lectura pública para usuarios autenticados; escritura solo admins.

#### `public.tickets`
- **Propósito**: Entidad central. Registro de solicitudes de soporte.
- **PK**: `id UUID`
- **Campos clave**: `titulo`, `descripcion`, `estado (ticket_status)`, `prioridad (ticket_priority)`, `servicio_id`, `creado_por`, `asignado_a`, `cerrado_en`
- **Auditoría**: `created_at`, `updated_at`, `created_by`
- **Relaciones**:
  - `creado_por → perfiles.id`
  - `asignado_a → perfiles.id` (nullable)
  - `servicio_id → catalogo_servicios.id`
- **RLS**: Usuarios ven sus tickets; agentes ven tickets asignados/sin asignar; admins ven todos.

#### `public.auditoria_tickets`
- **Propósito**: Log inmutable de cambios en tickets.
- **PK**: `id UUID`
- **Campos clave**: `ticket_id`, `campo_modificado`, `valor_anterior`, `valor_nuevo`, `modificado_por`, `modificado_en`
- **RLS**: Solo lectura para agentes/admins; sin UPDATE/DELETE posible vía RLS.

### Diagrama de relaciones

```
auth.users (1) ──────── (1) perfiles
                               │
                    ┌──────────┴──────────┐
                    │                     │
            tickets.creado_por    tickets.asignado_a
                    │
               tickets (N)
                    │
              ┌─────┴─────┐
              │            │
      catalogo_servicios  auditoria_tickets
      (jerárquico)        (append-only)
```

### Convenciones de nomenclatura

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Tablas | `snake_case`, plural | `catalogo_servicios` |
| Columnas | `snake_case` | `created_at` |
| PKs | `id UUID DEFAULT gen_random_uuid()` | `id` |
| FKs | `{tabla_referenciada}_id` | `servicio_id` |
| ENUMs | `snake_case`, singular descriptivo | `ticket_status` |
| Índices | `idx_{tabla}_{columna}` | `idx_tickets_estado` |

### Campos de auditoría obligatorios (tablas transaccionales)

```sql
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
created_by  UUID REFERENCES public.perfiles(id)
```

---

## Restricciones

- ❌ No usar `SERIAL` o `INTEGER` como PK. Siempre `UUID` con `gen_random_uuid()`.
- ❌ No modificar la tabla `auditoria_tickets` con UPDATE o DELETE desde la aplicación.
- ❌ No hacer `JOIN` directo con `auth.users` desde el cliente. Usar `perfiles` como proxy.
- ❌ No añadir columnas sin su correspondiente migración en `backend/database/schema.sql`.
- ❌ La jerarquía de `catalogo_servicios` no debe superar 3 niveles de profundidad en Fase 1.
