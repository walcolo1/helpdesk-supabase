# SKILL: Lógica de Negocio

## Cuándo usar esta skill

Activar cuando se necesite:
- Implementar transiciones de estado en tickets.
- Aplicar reglas de asignación de agentes.
- Calcular o validar SLAs.
- Definir flujos de trabajo (workflows) de soporte.
- Determinar qué acciones puede realizar cada rol.

---

## Contexto

El sistema ITSM sigue un modelo de ciclo de vida de tickets estrictamente controlado. Las transiciones de estado son el núcleo del negocio y deben validarse tanto en base de datos (constraints/triggers) como en la capa de API.

---

## Instrucciones

### Máquina de estados del ticket

```
                    ┌─────────────┐
              ┌────►│  pending    │◄────────────────────┐
              │     └──────┬──────┘                     │
              │            │ (asignación agente)         │
              │            ▼                             │
              │     ┌─────────────┐                      │
              │     │ in_progress │                      │
              │     └──────┬──────┘                      │
              │            │                             │
              │     ┌──────┴──────┐                      │
              │     ▼             ▼                      │
              │  resolved     cancelled ────────────────►┘
              │     │
              │     │ (confirmación usuario o auto después de N días)
              │     ▼
              └── closed
```

**Transiciones válidas:**

| Desde | Hacia | Actor permitido |
|-------|-------|-----------------|
| `pending` | `in_progress` | agent, admin |
| `pending` | `cancelled` | admin, creado_por |
| `in_progress` | `resolved` | agent, admin |
| `in_progress` | `pending` | agent, admin (re-apertura) |
| `in_progress` | `cancelled` | admin |
| `resolved` | `closed` | creado_por, admin (confirmación) |
| `resolved` | `in_progress` | creado_por (re-apertura si no satisfecho) |
| `closed` | — | Ninguno (estado terminal) |
| `cancelled` | — | Ninguno (estado terminal) |

### Reglas de asignación

1. **Auto-asignación**: En Fase 1 no existe. Todos los tickets nuevos quedan en `pending` sin agente.
2. **Asignación manual**: Solo `admin` o `agent` pueden asignarse o asignar tickets a otros agentes.
3. **Re-asignación**: Documentar en `auditoria_tickets` el cambio de `asignado_a`.

### Reglas de prioridad

| Prioridad | Descripción | SLA Respuesta | SLA Resolución |
|-----------|-------------|---------------|----------------|
| `low` | Solicitudes no urgentes | 48h | 5 días |
| `medium` | Impacto moderado | 24h | 3 días |
| `high` | Impacto alto en operación | 4h | 1 día |
| `critical` | Servicio crítico caído | 1h | 4h |

> **Nota Fase 1**: Los SLAs se almacenan en `catalogo_servicios` como referencia. El motor de cálculo y alertas se implementa en Fase 3.

### Auditoría automática

Todo cambio en los campos críticos de `tickets` debe registrarse en `auditoria_tickets`:
- Campos auditados: `estado`, `prioridad`, `asignado_a`, `servicio_id`
- El registro debe incluir: `ticket_id`, `campo_modificado`, `valor_anterior`, `valor_nuevo`, `modificado_por`, `modificado_en`
- En Fase 1: Se implementa vía trigger PostgreSQL (`trg_audit_tickets`).

### Catálogo de servicios

- Los servicios con `activo = false` no pueden ser seleccionados al crear nuevos tickets.
- Un servicio padre no puede desactivarse si tiene hijos activos.
- Los campos SLA del servicio son referenciales; la prioridad del ticket prevalece sobre el SLA del servicio en caso de conflicto.

---

## Restricciones

- ❌ No implementar transiciones de estado directamente desde el cliente sin validación en API Route.
- ❌ No permitir cerrar tickets en estado `pending` sin pasar por `in_progress` → `resolved`.
- ❌ No crear tickets con `servicio_id` que referencie un servicio `activo = false`.
- ❌ Los estados `closed` y `cancelled` son terminales: no se puede reabrir en Fase 1.
- ❌ No calcular SLAs en el frontend; reservado para Fase 3 con Edge Functions.
