-- Script de Seguridad: Activar Row Level Security (RLS) en Tablas de Negocio
-- Proyecto: helpdesk-supabase (ref: skjmcecphluebvtmnrji)
-- Propósito: Resolver alertas críticas de Supabase Security Advisor (rls_disabled_in_public y sensitive_columns_exposed).
--
-- Descripción:
-- Este script activa RLS en todas las tablas públicas creadas por Prisma. Dado que no se definen
-- políticas de acceso (políticas SELECT/INSERT/UPDATE/DELETE), por defecto PostgreSQL bloquea todo acceso
-- externo no autenticado (anon) y autenticado (authenticated) realizado a través de la API REST / GraphQL de Supabase (PostgREST).
--
-- El funcionamiento de la aplicación NO se verá afectado porque la app se conecta a PostgreSQL usando Prisma ORM
-- desde el servidor con la variable de entorno DATABASE_URL, utilizando el rol administrador (postgres),
-- el cual es propietario de las tablas o tiene privilegios de superusuario y por ende evade (bypasses) RLS por defecto.
--
-- REGLAS APLICADAS:
-- 1. NO se definen políticas públicas tipo `USING (true)`.
-- 2. NO se permite acceso anon/authenticated a tablas de negocio sensibles.
-- 3. Todos los accesos se bloquean en la API REST de Supabase, manteniendo el acceso de Prisma intacto.

-- Activar RLS en la tabla de usuarios
ALTER TABLE public."users" ENABLE ROW LEVEL SECURITY;

-- Activar RLS en la tabla de categorías
ALTER TABLE public."categories" ENABLE ROW LEVEL SECURITY;

-- Activar RLS en la tabla de servicios
ALTER TABLE public."services" ENABLE ROW LEVEL SECURITY;

-- Activar RLS en la tabla de tickets
ALTER TABLE public."tickets" ENABLE ROW LEVEL SECURITY;

-- Activar RLS en la tabla de historial de tickets
ALTER TABLE public."ticket_history" ENABLE ROW LEVEL SECURITY;

-- Activar RLS en la tabla de comentarios de tickets
ALTER TABLE public."ticket_comments" ENABLE ROW LEVEL SECURITY;

-- Activar RLS en la tabla de adjuntos de tickets
ALTER TABLE public."ticket_attachments" ENABLE ROW LEVEL SECURITY;

-- Activar RLS en la tabla de recursos
ALTER TABLE public."resources" ENABLE ROW LEVEL SECURITY;
