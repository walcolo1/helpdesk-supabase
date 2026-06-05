import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase con privilegios de Service Role.
 * SOLO usar en Server Actions o código server-only ("use server").
 * NUNCA importar en componentes cliente ni exponer con prefijo NEXT_PUBLIC.
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Supabase Storage no está configurado. " +
        "Agrega NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en las variables de entorno."
    );
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || "resources";
}

export function getAttachmentsBucket() {
  return process.env.SUPABASE_ATTACHMENTS_BUCKET || "attachments";
}
