-- =============================================================================
-- SISTEMA ITSM CORPORATIVO — ESQUEMA POSTGRESQL (SSOT)
-- Fuente Única de Verdad del Modelo de Datos
-- =============================================================================
-- Versión  : 1.0.0
-- Fase     : 1 — Estructura Base
-- Creado   : 2026-05-12
-- Plataforma: Supabase (PostgreSQL 15+)
--
-- INSTRUCCIONES DE USO:
--   Este archivo es el PLANO ARQUITECTÓNICO del sistema. No se ejecuta
--   directamente contra la base de datos. Las migraciones se generan a
--   partir de este esquema usando las herramientas de Supabase CLI.
--
--   Orden de ejecución al crear migraciones:
--   1. Extensions
--   2. ENUMs
--   3. Tablas (en orden de dependencias)
--   4. Índices
--   5. Funciones auxiliares
--   6. Triggers
--   7. Políticas RLS
--   8. Grants
-- =============================================================================


-- =============================================================================
-- SECCIÓN 1: EXTENSIONES
-- =============================================================================

-- uuid_generate_v4() como alternativa a gen_random_uuid() (nativo en PG14+)
-- gen_random_uuid() se usa directamente sin extensión en PostgreSQL 14+
-- pgcrypto se incluye por compatibilidad con algunas funciones de Supabase
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- SECCIÓN 2: TIPOS ENUMERADOS (ENUMs)
-- =============================================================================

-- Estado del ciclo de vida de un ticket
-- pending     → Creado, sin agente asignado
-- in_progress → Asignado a un agente, siendo atendido
-- resolved    → Agente marcó como resuelto, pendiente confirmación usuario
-- closed      → Confirmado como resuelto (estado TERMINAL)
-- cancelled   → Cancelado por admin o usuario creador (estado TERMINAL)
CREATE TYPE public.ticket_status AS ENUM (
    'pending',
    'in_progress',
    'resolved',
    'closed',
    'cancelled'
);

-- Prioridad de atención del ticket (define SLA aplicable)
-- low      → 48h respuesta / 5 días resolución
-- medium   → 24h respuesta / 3 días resolución
-- high     → 4h respuesta  / 1 día resolución
-- critical → 1h respuesta  / 4h resolución
CREATE TYPE public.ticket_priority AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

-- Rol del usuario dentro del sistema ITSM
-- end_user → Usuario final corporativo (solo sus propios tickets)
-- agent    → Agente de soporte IT (gestión de tickets asignados)
-- admin    → Administrador del sistema (acceso total)
CREATE TYPE public.user_role AS ENUM (
    'end_user',
    'agent',
    'admin'
);


-- =============================================================================
-- SECCIÓN 3: TABLAS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3.1 PERFILES
-- Extiende auth.users de Supabase con datos propios del sistema ITSM.
-- Relación 1:1 con auth.users. El id es el mismo UUID de Supabase Auth.
-- -----------------------------------------------------------------------------
CREATE TABLE public.perfiles (
    -- Clave primaria: mismo UUID que auth.users
    id                UUID        NOT NULL,
    
    -- Datos personales básicos
    nombre_completo   TEXT        NOT NULL,
    email             TEXT        NOT NULL,
    
    -- Rol ITSM del usuario en el sistema
    rol               public.user_role NOT NULL DEFAULT 'end_user',
    
    -- Departamento o área organizacional (opcional en Fase 1)
    departamento      TEXT,
    
    -- Teléfono de contacto (opcional)
    telefono          TEXT,
    
    -- Foto de perfil (URL a Supabase Storage — Fase 2)
    avatar_url        TEXT,
    
    -- Estado de la cuenta en el sistema
    activo            BOOLEAN     NOT NULL DEFAULT TRUE,
    
    -- Auditoría de creación/actualización del perfil
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Restricciones
    CONSTRAINT perfiles_pkey PRIMARY KEY (id),
    CONSTRAINT perfiles_email_unique UNIQUE (email),
    CONSTRAINT perfiles_id_fkey FOREIGN KEY (id)
        REFERENCES auth.users (id) ON DELETE CASCADE
);

COMMENT ON TABLE public.perfiles IS
    'Extensión de auth.users con datos ITSM. Relación 1:1. '
    'El id corresponde al UUID de Supabase Auth.';
COMMENT ON COLUMN public.perfiles.rol IS
    'Rol del usuario: end_user (solo sus tickets), agent (soporte), admin (total).';
COMMENT ON COLUMN public.perfiles.activo IS
    'false = cuenta deshabilitada en el sistema ITSM (no elimina auth.users).';


-- -----------------------------------------------------------------------------
-- 3.2 CATÁLOGO DE SERVICIOS
-- Árbol jerárquico de servicios IT ofrecidos. Máx. 3 niveles en Fase 1.
-- Los servicios inactivos no pueden ser seleccionados en nuevos tickets.
-- -----------------------------------------------------------------------------
CREATE TABLE public.catalogo_servicios (
    id                  UUID        NOT NULL DEFAULT gen_random_uuid(),
    
    -- Nombre del servicio (ej: "Conectividad VPN", "Instalación Software")
    nombre              TEXT        NOT NULL,
    
    -- Descripción detallada del servicio para el usuario final
    descripcion         TEXT,
    
    -- Referencia al servicio padre (NULL = servicio raíz/categoría)
    padre_id            UUID,
    
    -- SLA en horas — tiempo máximo de primera respuesta para este servicio
    sla_horas_respuesta   INTEGER,
    
    -- SLA en horas — tiempo máximo de resolución para este servicio
    sla_horas_resolucion  INTEGER,
    
    -- Ícono o código de categoría visual (para UI — Fase 2)
    icono               TEXT,
    
    -- Posición de orden visual dentro de su grupo
    orden               INTEGER     NOT NULL DEFAULT 0,
    
    -- Si false: no aparece en selector de nuevos tickets
    activo              BOOLEAN     NOT NULL DEFAULT TRUE,
    
    -- Auditoría
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Restricciones
    CONSTRAINT catalogo_servicios_pkey PRIMARY KEY (id),
    CONSTRAINT catalogo_servicios_nombre_unique UNIQUE (nombre),
    CONSTRAINT catalogo_servicios_padre_fkey FOREIGN KEY (padre_id)
        REFERENCES public.catalogo_servicios (id) ON DELETE RESTRICT,
    CONSTRAINT catalogo_servicios_sla_respuesta_check
        CHECK (sla_horas_respuesta IS NULL OR sla_horas_respuesta > 0),
    CONSTRAINT catalogo_servicios_sla_resolucion_check
        CHECK (sla_horas_resolucion IS NULL OR sla_horas_resolucion > 0)
);

COMMENT ON TABLE public.catalogo_servicios IS
    'Catálogo jerárquico de servicios IT. Árbol recursivo mediante padre_id. '
    'Máximo 3 niveles de profundidad en Fase 1.';
COMMENT ON COLUMN public.catalogo_servicios.padre_id IS
    'NULL indica servicio raíz (categoría principal). '
    'Referencia recursiva al mismo catálogo.';
COMMENT ON COLUMN public.catalogo_servicios.sla_horas_respuesta IS
    'SLA de referencia en horas. La prioridad del ticket prevalece en conflicto.';


-- -----------------------------------------------------------------------------
-- 3.3 TICKETS
-- Entidad central del sistema ITSM. Registra solicitudes de soporte.
-- Incluye campos de auditoría obligatorios y referencias a perfiles y catálogo.
-- -----------------------------------------------------------------------------
CREATE TABLE public.tickets (
    id                  UUID                   NOT NULL DEFAULT gen_random_uuid(),
    
    -- Resumen breve del problema o solicitud
    titulo              TEXT                   NOT NULL,
    
    -- Descripción detallada del problema (texto largo, markdown en Fase 2)
    descripcion         TEXT                   NOT NULL,
    
    -- Estado actual en el ciclo de vida del ticket
    estado              public.ticket_status   NOT NULL DEFAULT 'pending',
    
    -- Prioridad de atención (define SLA aplicable)
    prioridad           public.ticket_priority NOT NULL DEFAULT 'medium',
    
    -- Servicio del catálogo al que pertenece este ticket
    servicio_id         UUID                   NOT NULL,
    
    -- Usuario que creó el ticket (siempre un usuario autenticado)
    creado_por          UUID                   NOT NULL,
    
    -- Agente asignado para resolver el ticket (NULL = sin asignar)
    asignado_a          UUID,
    
    -- Timestamp cuando el ticket pasó a estado 'closed' o 'cancelled'
    cerrado_en          TIMESTAMPTZ,
    
    -- Campos de auditoría obligatorios
    created_at          TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
    -- created_by es igual a creado_por en tickets (quien lo creó)
    created_by          UUID                   NOT NULL,

    -- Restricciones
    CONSTRAINT tickets_pkey PRIMARY KEY (id),
    CONSTRAINT tickets_servicio_fkey FOREIGN KEY (servicio_id)
        REFERENCES public.catalogo_servicios (id) ON DELETE RESTRICT,
    CONSTRAINT tickets_creado_por_fkey FOREIGN KEY (creado_por)
        REFERENCES public.perfiles (id) ON DELETE RESTRICT,
    CONSTRAINT tickets_asignado_a_fkey FOREIGN KEY (asignado_a)
        REFERENCES public.perfiles (id) ON DELETE SET NULL,
    CONSTRAINT tickets_created_by_fkey FOREIGN KEY (created_by)
        REFERENCES public.perfiles (id) ON DELETE RESTRICT,
    CONSTRAINT tickets_titulo_length CHECK (char_length(titulo) BETWEEN 5 AND 200),
    CONSTRAINT tickets_descripcion_length CHECK (char_length(descripcion) >= 10),
    -- Un ticket solo puede estar in_progress si tiene agente asignado
    CONSTRAINT tickets_estado_asignado_check CHECK (
        NOT (estado = 'in_progress' AND asignado_a IS NULL)
    ),
    -- cerrado_en solo aplica a estados terminales
    CONSTRAINT tickets_cerrado_en_check CHECK (
        cerrado_en IS NULL
        OR estado IN ('closed', 'cancelled')
    )
);

COMMENT ON TABLE public.tickets IS
    'Entidad central del sistema ITSM. Registra solicitudes de soporte. '
    'Incluye auditoría completa y restricciones de integridad de estados.';
COMMENT ON COLUMN public.tickets.estado IS
    'Ciclo de vida: pending → in_progress → resolved → closed. '
    'Estados terminales: closed, cancelled.';
COMMENT ON COLUMN public.tickets.asignado_a IS
    'NULL = ticket sin asignar (solo permitido en estado pending). '
    'Solo perfiles con rol agent o admin pueden ser asignados.';
COMMENT ON COLUMN public.tickets.created_by IS
    'Campo de auditoría estándar. Igual a creado_por en el contexto de tickets. '
    'Se mantiene separado para consistencia con el patrón de auditoría del sistema.';


-- -----------------------------------------------------------------------------
-- 3.4 AUDITORÍA DE TICKETS
-- Log inmutable de cambios en campos críticos de tickets.
-- Solo INSERT permitido vía trigger. No se puede UPDATE ni DELETE.
-- -----------------------------------------------------------------------------
CREATE TABLE public.auditoria_tickets (
    id                  UUID        NOT NULL DEFAULT gen_random_uuid(),
    
    -- Ticket que fue modificado
    ticket_id           UUID        NOT NULL,
    
    -- Nombre del campo que fue modificado (ej: 'estado', 'prioridad', 'asignado_a')
    campo_modificado    TEXT        NOT NULL,
    
    -- Valor anterior (serializado como TEXT para soportar cualquier tipo)
    valor_anterior      TEXT,
    
    -- Valor nuevo
    valor_nuevo         TEXT,
    
    -- Usuario que realizó el cambio
    modificado_por      UUID        NOT NULL,
    
    -- Timestamp exacto del cambio
    modificado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Restricciones
    CONSTRAINT auditoria_tickets_pkey PRIMARY KEY (id),
    CONSTRAINT auditoria_tickets_ticket_fkey FOREIGN KEY (ticket_id)
        REFERENCES public.tickets (id) ON DELETE CASCADE,
    CONSTRAINT auditoria_tickets_modificado_por_fkey FOREIGN KEY (modificado_por)
        REFERENCES public.perfiles (id) ON DELETE RESTRICT,
    CONSTRAINT auditoria_tickets_campo_check
        CHECK (char_length(campo_modificado) > 0)
);

COMMENT ON TABLE public.auditoria_tickets IS
    'Log inmutable de cambios en tickets. Solo INSERT via trigger. '
    'Las políticas RLS prohíben UPDATE y DELETE desde cualquier rol.';
COMMENT ON COLUMN public.auditoria_tickets.valor_anterior IS
    'Valor anterior serializado como TEXT. NULL si el campo no tenía valor previo.';


-- =============================================================================
-- SECCIÓN 4: ÍNDICES
-- Cubren los patrones de consulta más frecuentes del sistema ITSM.
-- =============================================================================

-- Búsqueda de tickets por usuario creador (bandeja de entrada del usuario)
CREATE INDEX idx_tickets_creado_por
    ON public.tickets (creado_por);

-- Búsqueda de tickets asignados a un agente (bandeja del agente)
CREATE INDEX idx_tickets_asignado_a
    ON public.tickets (asignado_a)
    WHERE asignado_a IS NOT NULL;

-- Filtrado de tickets por estado (vista de pipeline)
CREATE INDEX idx_tickets_estado
    ON public.tickets (estado);

-- Filtrado de tickets por prioridad (para triaje)
CREATE INDEX idx_tickets_prioridad
    ON public.tickets (prioridad);

-- Filtrado compuesto: agente + estado (consulta más común en bandeja del agente)
CREATE INDEX idx_tickets_asignado_estado
    ON public.tickets (asignado_a, estado)
    WHERE asignado_a IS NOT NULL;

-- Tickets por servicio (métricas por categoría)
CREATE INDEX idx_tickets_servicio_id
    ON public.tickets (servicio_id);

-- Auditoría: buscar todos los cambios de un ticket
CREATE INDEX idx_auditoria_ticket_id
    ON public.auditoria_tickets (ticket_id);

-- Auditoría: buscar cambios por usuario
CREATE INDEX idx_auditoria_modificado_por
    ON public.auditoria_tickets (modificado_por);

-- Catálogo: árbol jerárquico (buscar hijos de un nodo)
CREATE INDEX idx_catalogo_padre_id
    ON public.catalogo_servicios (padre_id)
    WHERE padre_id IS NOT NULL;

-- Catálogo: filtrar solo activos (consulta más frecuente al crear tickets)
CREATE INDEX idx_catalogo_activo
    ON public.catalogo_servicios (activo)
    WHERE activo = TRUE;


-- =============================================================================
-- SECCIÓN 5: FUNCIONES AUXILIARES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 5.1 Actualización automática de updated_at
-- Se usa en triggers de todas las tablas con este campo.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.set_updated_at() IS
    'Trigger function: actualiza updated_at al valor actual en cada UPDATE.';


-- -----------------------------------------------------------------------------
-- 5.2 Helper: obtener el rol del usuario actual
-- SECURITY DEFINER: se ejecuta con permisos del owner, no del caller.
-- Usado en políticas RLS para evitar consultas recursivas.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role AS $$
    SELECT rol FROM public.perfiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_user_role() IS
    'Retorna el rol ITSM del usuario autenticado actualmente. '
    'Usado en políticas RLS. SECURITY DEFINER para evitar recursión.';


-- -----------------------------------------------------------------------------
-- 5.3 Helper: verificar si el usuario actual es admin
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.perfiles
        WHERE id = auth.uid() AND rol = 'admin' AND activo = TRUE
    )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_admin() IS
    'Retorna TRUE si el usuario autenticado tiene rol admin y está activo.';


-- -----------------------------------------------------------------------------
-- 5.4 Helper: verificar si el usuario actual es agente o admin
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_agent_or_admin()
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.perfiles
        WHERE id = auth.uid() AND rol IN ('agent', 'admin') AND activo = TRUE
    )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_agent_or_admin() IS
    'Retorna TRUE si el usuario autenticado tiene rol agent o admin y está activo.';


-- -----------------------------------------------------------------------------
-- 5.5 Trigger: sincronizar auth.users → perfiles al registrar usuario
-- Se ejecuta automáticamente cuando Supabase Auth crea un nuevo usuario.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfiles (id, email, nombre_completo, rol)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email),
        'end_user'   -- rol por defecto para nuevos usuarios
    )
    ON CONFLICT (id) DO NOTHING; -- idempotente en caso de re-ejecución
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS
    'Crea automáticamente un registro en perfiles cuando se crea un usuario '
    'en auth.users. El rol por defecto es end_user.';


-- -----------------------------------------------------------------------------
-- 5.6 Trigger: registrar cambios en campos críticos de tickets
-- Audita automáticamente: estado, prioridad, asignado_a, servicio_id
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.audit_ticket_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    -- Si auth.uid() no está disponible (llamada interna), usar created_by
    IF v_user_id IS NULL THEN
        v_user_id := NEW.created_by;
    END IF;

    -- Auditar cambio de estado
    IF OLD.estado IS DISTINCT FROM NEW.estado THEN
        INSERT INTO public.auditoria_tickets
            (ticket_id, campo_modificado, valor_anterior, valor_nuevo, modificado_por)
        VALUES
            (NEW.id, 'estado', OLD.estado::TEXT, NEW.estado::TEXT, v_user_id);
    END IF;

    -- Auditar cambio de prioridad
    IF OLD.prioridad IS DISTINCT FROM NEW.prioridad THEN
        INSERT INTO public.auditoria_tickets
            (ticket_id, campo_modificado, valor_anterior, valor_nuevo, modificado_por)
        VALUES
            (NEW.id, 'prioridad', OLD.prioridad::TEXT, NEW.prioridad::TEXT, v_user_id);
    END IF;

    -- Auditar reasignación de agente
    IF OLD.asignado_a IS DISTINCT FROM NEW.asignado_a THEN
        INSERT INTO public.auditoria_tickets
            (ticket_id, campo_modificado, valor_anterior, valor_nuevo, modificado_por)
        VALUES
            (NEW.id, 'asignado_a', OLD.asignado_a::TEXT, NEW.asignado_a::TEXT, v_user_id);
    END IF;

    -- Auditar cambio de servicio
    IF OLD.servicio_id IS DISTINCT FROM NEW.servicio_id THEN
        INSERT INTO public.auditoria_tickets
            (ticket_id, campo_modificado, valor_anterior, valor_nuevo, modificado_por)
        VALUES
            (NEW.id, 'servicio_id', OLD.servicio_id::TEXT, NEW.servicio_id::TEXT, v_user_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.audit_ticket_changes() IS
    'Registra automáticamente en auditoria_tickets cualquier cambio en '
    'estado, prioridad, asignado_a o servicio_id de un ticket.';


-- =============================================================================
-- SECCIÓN 6: TRIGGERS
-- =============================================================================

-- Actualizar updated_at en perfiles
CREATE TRIGGER trg_perfiles_updated_at
    BEFORE UPDATE ON public.perfiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Actualizar updated_at en catalogo_servicios
CREATE TRIGGER trg_catalogo_updated_at
    BEFORE UPDATE ON public.catalogo_servicios
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Actualizar updated_at en tickets
CREATE TRIGGER trg_tickets_updated_at
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auditar cambios críticos en tickets
CREATE TRIGGER trg_audit_tickets
    AFTER UPDATE ON public.tickets
    FOR EACH ROW EXECUTE FUNCTION public.audit_ticket_changes();

-- Crear perfil automáticamente al registrar usuario en auth
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================================================
-- SECCIÓN 7: ROW LEVEL SECURITY (RLS)
-- Borrador estructural — Fase 1
-- IMPORTANTE: Revisar y ajustar cada política antes de producción.
-- =============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.perfiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_tickets  ENABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------------
-- RLS: PERFILES
-- -----------------------------------------------------------------------------

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "perfiles_select_own"
    ON public.perfiles
    FOR SELECT
    USING (auth.uid() = id);

-- Agentes y admins pueden ver todos los perfiles activos
CREATE POLICY "perfiles_select_agents_admins"
    ON public.perfiles
    FOR SELECT
    USING (public.is_agent_or_admin() AND activo = TRUE);

-- Un usuario puede actualizar su propio perfil (campos no críticos)
CREATE POLICY "perfiles_update_own"
    ON public.perfiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Solo admins pueden crear, actualizar cualquier perfil o eliminar
CREATE POLICY "perfiles_admin_all"
    ON public.perfiles
    FOR ALL
    USING (public.is_admin());


-- -----------------------------------------------------------------------------
-- RLS: CATÁLOGO DE SERVICIOS
-- -----------------------------------------------------------------------------

-- Todos los usuarios autenticados pueden ver servicios activos
CREATE POLICY "catalogo_select_activos"
    ON public.catalogo_servicios
    FOR SELECT
    USING (activo = TRUE AND auth.uid() IS NOT NULL);

-- Agentes y admins pueden ver todos los servicios (incluyendo inactivos)
CREATE POLICY "catalogo_select_agentes_admins"
    ON public.catalogo_servicios
    FOR SELECT
    USING (public.is_agent_or_admin());

-- Solo admins pueden crear/modificar/eliminar servicios
CREATE POLICY "catalogo_admin_write"
    ON public.catalogo_servicios
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());


-- -----------------------------------------------------------------------------
-- RLS: TICKETS
-- -----------------------------------------------------------------------------

-- Usuarios finales solo ven sus propios tickets
CREATE POLICY "tickets_select_own"
    ON public.tickets
    FOR SELECT
    USING (auth.uid() = creado_por);

-- Agentes ven todos los tickets (asignados y sin asignar)
CREATE POLICY "tickets_select_agents"
    ON public.tickets
    FOR SELECT
    USING (public.is_agent_or_admin());

-- Cualquier usuario autenticado puede crear un ticket
CREATE POLICY "tickets_insert_authenticated"
    ON public.tickets
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND auth.uid() = creado_por
        AND auth.uid() = created_by
    );

-- Usuarios pueden actualizar solo sus tickets en estado 'pending'
-- (por ejemplo, para cancelar o modificar descripción antes de atención)
CREATE POLICY "tickets_update_own_pending"
    ON public.tickets
    FOR UPDATE
    USING (
        auth.uid() = creado_por
        AND estado = 'pending'
    )
    WITH CHECK (
        auth.uid() = creado_por
        AND estado IN ('pending', 'cancelled')
    );

-- Agentes y admins pueden actualizar cualquier ticket
CREATE POLICY "tickets_update_agents_admins"
    ON public.tickets
    FOR UPDATE
    USING (public.is_agent_or_admin())
    WITH CHECK (public.is_agent_or_admin());

-- Solo admins pueden eliminar tickets
CREATE POLICY "tickets_delete_admin"
    ON public.tickets
    FOR DELETE
    USING (public.is_admin());


-- -----------------------------------------------------------------------------
-- RLS: AUDITORÍA DE TICKETS
-- -----------------------------------------------------------------------------

-- Usuarios pueden ver auditoría de sus propios tickets
CREATE POLICY "auditoria_select_own"
    ON public.auditoria_tickets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tickets t
            WHERE t.id = ticket_id AND t.creado_por = auth.uid()
        )
    );

-- Agentes y admins pueden ver toda la auditoría
CREATE POLICY "auditoria_select_agents_admins"
    ON public.auditoria_tickets
    FOR SELECT
    USING (public.is_agent_or_admin());

-- NINGÚN rol puede insertar directamente en auditoria_tickets
-- Los inserts solo ocurren via trigger (SECURITY DEFINER)
-- No se define política INSERT — se deniega por defecto con RLS activo

-- NINGÚN rol puede actualizar o eliminar registros de auditoría
-- No se definen políticas UPDATE/DELETE — se deniegan por defecto


-- =============================================================================
-- SECCIÓN 8: GRANTS (Permisos de esquema)
-- =============================================================================

-- El rol 'anon' de Supabase no debe tener acceso a ninguna tabla de negocio
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- El rol 'authenticated' de Supabase tiene acceso base; RLS controla el resto
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.perfiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT SELECT ON public.catalogo_servicios TO authenticated;
GRANT SELECT ON public.auditoria_tickets TO authenticated;

-- El service_role bypassa RLS — usar solo en contextos de servidor seguros
-- (Edge Functions, migraciones, tareas administrativas)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;


-- =============================================================================
-- FIN DEL ESQUEMA
-- =============================================================================
-- Próximos pasos (Fase 2):
--   - Agregar campo 'tipo' a tickets (ENUM: incidente, solicitud, consulta)
--   - Agregar campo 'descripcion_resolucion' a tickets
--   - Agregar campo 'primera_respuesta_en' para cálculo de SLA
--   - Crear trigger de ID amigable (TKT-YYYYMMDD-XXXX)
--   - Supabase Storage: bucket 'ticket-attachments'
--   - Vistas: v_tickets_abiertos, v_tickets_por_agente
-- =============================================================================
