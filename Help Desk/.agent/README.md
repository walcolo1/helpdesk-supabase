# .agent — Base de Conocimiento Interna del Proyecto ITSM

## Propósito

Este directorio contiene el conocimiento interno estructurado del proyecto. Es la fuente de verdad para el agente de IA que asiste en el desarrollo, mantenimiento y evolución del sistema ITSM corporativo.

## Estructura

```
.agent/
├── README.md                   ← Este archivo
└── skills/
    ├── base-rules/
    │   └── SKILL.md            ← Reglas globales y restricciones del proyecto
    ├── data-models/
    │   └── SKILL.md            ← Modelo de datos, tablas, ENUMs y relaciones
    ├── business-logic/
    │   └── SKILL.md            ← Lógica de negocio y flujos de trabajo
    ├── identity-rbac/
    │   └── SKILL.md            ← Identidad, roles, RLS y control de acceso
    └── itsm-rules/
        └── SKILL.md            ← Reglas específicas del dominio ITSM
```

## Cómo usar este directorio

- **Antes de implementar cualquier feature**: leer el skill relevante para entender el contexto y restricciones.
- **SSOT del modelo de datos**: `backend/database/schema.sql` es la fuente única de verdad. Cualquier cambio en el modelo debe reflejarse ahí primero.
- **Seguridad**: Toda lógica de autorización debe implementarse en RLS (PostgreSQL) y validaciones de servidor. El frontend nunca es la última línea de defensa.

## Fases del Proyecto

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1    | Estructura base, modelo de datos SSOT, skills iniciales | ✅ Activa |
| 2    | Autenticación, UI base, integraciones Supabase | ⏳ Pendiente |
| 3    | Módulos ITSM avanzados (SLA, notificaciones, reportes) | ⏳ Pendiente |

## Principios Clave

1. **Database-first**: El esquema define el sistema, no al revés.
2. **RLS como contrato de seguridad**: Las políticas de Row Level Security son parte del dominio, no infraestructura.
3. **Auditoría completa**: Toda acción sobre datos transaccionales queda registrada.
4. **Separación de responsabilidades**: Backend valida, frontend presenta.
