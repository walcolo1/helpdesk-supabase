# SKILL: Identidad y Control de Acceso (RBAC + RLS)

## Cuándo usar esta skill

Activar cuando se necesite:
- Definir o modificar políticas RLS en PostgreSQL.
- Implementar guards de autorización en API Routes.
- Determinar qué puede ver/hacer cada rol.
- Integrar Supabase Auth con la tabla `perfiles`.

---

## Contexto

El sistema usa **Supabase Auth** como proveedor de identidad. La autorización se implementa mediante **Row Level Security (RLS)** en PostgreSQL, complementada con validaciones en la capa de API (Next.js Route Handlers).

**Roles del sistema** (ENUM `user_role`):

| Rol | Descripción |
|-----|-------------|
| `end_user` | Usuario final corporativo — solo sus propios datos |
| `agent` | Agente de soporte IT — tickets asignados y catálogo |
| `admin` | Administrador del sistema — acceso total |

---

## Instrucciones

### Helper functions para RLS

```sql
-- Rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT rol FROM public.perfiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ¿Es admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ¿Es agente o admin?
CREATE OR REPLACE FUNCTION public.is_agent_or_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('agent', 'admin')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### Matriz de permisos por tabla

| Tabla | end_user | agent | admin |
|-------|----------|-------|-------|
| `perfiles` SELECT | Solo propio | Todos (básico) | Todos |
| `perfiles` UPDATE | Solo propio | Solo propio | Todos |
| `catalogo_servicios` SELECT | Activos | Todos | Todos |
| `catalogo_servicios` INSERT/UPDATE/DELETE | ❌ | ❌ | ✅ |
| `tickets` SELECT | Solo propios | Todos | Todos |
| `tickets` INSERT | ✅ | ✅ | ✅ |
| `tickets` UPDATE | Limitado | ✅ | ✅ |
| `auditoria_tickets` SELECT | Sus tickets | Todos | Todos |
| `auditoria_tickets` INSERT/UPDATE/DELETE | Solo trigger | Solo trigger | Solo trigger |

### Trigger: sincronizar auth.users → perfiles

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfiles (id, email, nombre_completo, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email),
    'end_user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Patrón de autorización en API Routes (Next.js 14)

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function PATCH(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('perfiles').select('rol').eq('id', session.user.id).single()

  if (!['agent', 'admin'].includes(perfil?.rol ?? ''))
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  // ...continuar con lógica protegida
}
```

---

## Restricciones

- ❌ No deshabilitar RLS en ninguna tabla del schema `public`.
- ❌ No almacenar el rol solo en el JWT — siempre verificar contra `perfiles`.
- ❌ No exponer la `service_role` key en variables `NEXT_PUBLIC_*`.
- ❌ No usar `USING (true)` sin justificación documentada.
- ❌ No implementar UI de autenticación en Fase 1.
