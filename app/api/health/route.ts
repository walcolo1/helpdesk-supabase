/**
 * Health Check Endpoint — Sistema ITSM Corporativo
 * Ruta: GET /api/health
 *
 * Propósito: Validar que el servidor Next.js está operativo y que
 * la inicialización del proyecto (Fase 1) fue completada correctamente.
 *
 * Respuesta exitosa:
 *   HTTP 200
 *   { "status": "ok", "phase": "1", "database_model": "defined" }
 *
 * Nota: Este endpoint NO verifica conectividad con Supabase en Fase 1.
 * La verificación de conexión a base de datos se implementará en Fase 2
 * cuando las variables de entorno estén configuradas.
 */

import { NextResponse } from 'next/server'

// Forzar evaluación dinámica en cada request (no cachear el health check)
export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  const response = {
    status: 'ok',
    phase: '1',
    database_model: 'defined',
    // Información adicional de contexto (útil para debugging en CI/CD)
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'unknown',
  }

  return NextResponse.json(response, {
    status: 200,
    headers: {
      // Prevenir caché en proxies y navegadores
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Rechazar explícitamente métodos no permitidos
 */
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method Not Allowed' },
    { status: 405 }
  )
}
