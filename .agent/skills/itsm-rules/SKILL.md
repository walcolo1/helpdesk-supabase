# SKILL: Reglas del Dominio ITSM

## Cuándo usar esta skill

Activar cuando se necesite:
- Implementar o revisar flujos de tickets.
- Definir categorías del catálogo de servicios.
- Aplicar criterios de priorización.
- Diseñar reportes o métricas ITSM.
- Validar que el sistema cumple estándares ITIL básicos.

---

## Contexto

Este sistema sigue principios de **ITIL v4** adaptados a una organización corporativa mediana. El alcance de Fase 1 cubre **Gestión de Incidentes** y **Gestión de Solicitudes de Servicio**. Los módulos de Cambios y Problemas están reservados para fases futuras.

---

## Instrucciones

### Tipos de ticket (campo `tipo` — Fase 2)

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `incidente` | Interrupción no planificada de un servicio | VPN caída |
| `solicitud` | Petición de servicio estándar | Instalar software |
| `consulta` | Pregunta sobre un servicio | ¿Cómo configuro X? |

> **Fase 1**: El campo `tipo` no existe aún. Todos los tickets son genéricos.

### Ciclo de vida del ticket

```
CREACIÓN → PENDING → IN_PROGRESS → RESOLVED → CLOSED
                                            ↑
                  CANCELLED ←──── (cualquier estado no terminal)
```

**Reglas obligatorias:**
1. Todo ticket nuevo inicia en `pending`.
2. Un ticket solo puede ser `in_progress` si tiene un agente asignado (`asignado_a IS NOT NULL`).
3. `resolved` requiere que el agente documente la resolución (campo `descripcion_resolucion` — Fase 2).
4. `closed` es terminal: no hay re-apertura en Fase 1.
5. `cancelled` solo lo puede ejecutar el `admin` o el `creado_por` si está en `pending`.

### Catálogo de servicios — Categorías iniciales sugeridas

```
📁 Infraestructura
  ├── Conectividad (Red, VPN, WiFi)
  ├── Servidores y Almacenamiento
  └── Telefonía

📁 Software y Aplicaciones
  ├── Instalación / Actualización
  ├── Licencias
  └── Accesos y Permisos

📁 Hardware
  ├── Equipos de Cómputo
  └── Periféricos

📁 Soporte General
  ├── Consultas
  └── Capacitación
```

### SLA de referencia por prioridad

| Prioridad | Tiempo de respuesta | Tiempo de resolución | Escalamiento |
|-----------|---------------------|----------------------|--------------|
| `critical` | 1 hora | 4 horas | Inmediato a admin |
| `high` | 4 horas | 1 día hábil | 2h sin respuesta |
| `medium` | 24 horas | 3 días hábiles | 8h sin respuesta |
| `low` | 48 horas | 5 días hábiles | Sin escalamiento automático |

> **Fase 1**: Los SLAs son referenciales. El motor de alertas y escalamiento se implementa en Fase 3.

### Reglas de priorización automática (Fase 2)

Las siguientes combinaciones **sugieren** una prioridad al crear el ticket (no son obligatorias):
- Servicio categoría `Infraestructura` + más de 5 usuarios afectados → `high`
- Cualquier servicio de producción caído → `critical`
- Solicitudes de acceso/licencias → `low`

### Métricas ITSM a rastrear (Fase 3)

- **MTTR** (Mean Time to Resolve): `cerrado_en - created_at`
- **First Response Time**: `primera_respuesta_en - created_at` (campo Fase 2)
- **Ticket Volume**: tickets por categoría/período
- **SLA Compliance Rate**: % tickets resueltos dentro del SLA

### Nomenclatura de tickets

- Los tickets se identifican internamente por su `UUID`.
- El ID amigable (`TKT-YYYYMMDD-XXXX`) se genera en Fase 2 como campo calculado o secuencia.

---

## Restricciones

- ❌ No cerrar tickets directamente sin pasar por `resolved`.
- ❌ No asignar tickets a usuarios con rol `end_user`.
- ❌ No crear servicios de catálogo con más de 3 niveles de jerarquía en Fase 1.
- ❌ No implementar escalamiento automático por SLA en Fase 1.
- ❌ No gestionar Cambios o Problemas (ITIL) hasta Fase 3+.
- ❌ No calcular métricas ITSM en el frontend; usar vistas materializadas en DB (Fase 3).
