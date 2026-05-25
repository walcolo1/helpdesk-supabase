# Help Desk / ITSM 🛠️

Un sistema de mesa de ayuda (Help Desk) y gestión de servicios IT (ITSM) moderno, construido para ofrecer un control impecable sobre incidentes corporativos, categorización de servicios, base de conocimientos (recursos) y gestión de acceso centralizado.

![Estado](https://img.shields.io/badge/Estado-MVP_v1.0_Estable-success)
![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black)
![Prisma](https://img.shields.io/badge/Prisma-ORM-blue)
![Auth.js](https://img.shields.io/badge/Auth.js-v5-purple)

## Características Principales

- **Dashboard Operativo**: KPIs en tiempo real dependientes del nivel de acceso y tracking visual de la última actividad del sistema.
- **Centro de Tickets Inteligente**: Control de asignaciones, niveles de prioridad (Bajo a Crítico) y comentarios interactivos por hilo.
- **Catálogo Jerárquico**: Organización de solicitudes basada en `Categorías > Servicios` para enrutar los problemas al equipo correcto.
- **Gestión Avanzada de Usuarios (IAM)**:
  - Tres roles estrictos: `admin`, `agent` y `user`.
  - Onboarding de usuarios por parte de TI con contraseñas temporales y exigencia de cambio obligatorio.
  - Vencimiento de cuentas calendarizado.
- **Centro de Recursos Corporativos**: Repositorio de manuales, PDFs y planillas para que los usuarios encuentren soluciones de primera mano.

## Stack Tecnológico

- **Frontend**: React 18, Next.js 14 (App Router, Server Components), Tailwind CSS, Lucide Icons.
- **Backend**: Next.js Server Actions, Node.js.
- **Base de Datos**: MySQL via Prisma ORM.
- **Seguridad**: Auth.js (NextAuth), JWT, Bcrypt.
- **Integraciones**: Resend (Emails Transaccionales).

## Requisitos Previos

- Node.js v18.17+
- Base de datos MySQL en ejecución (local o en la nube)

## Instalación y Despliegue Local

1. **Clonar e instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar el entorno:**
   Crear un archivo `.env` en la raíz del proyecto basándose en `.env.example`:
   ```env
   DATABASE_URL="mysql://usuario:password@localhost:3306/helpdesk_db"
   AUTH_SECRET="tu-secreto-seguro-aqui"
   RESEND_API_KEY="re_123456789"
   ```

3. **Inicializar la Base de Datos:**
   Sincronizar el esquema Prisma y generar el cliente local:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

4. **Levantar el Servidor de Desarrollo:**
   ```bash
   npm run dev
   ```
   *Accede a [http://localhost:3000](http://localhost:3000)*

## Documentación Técnica

Para conocer los flujos arquitectónicos detallados, los cierres de versión y las preparaciones necesarias para un despliegue en producción Serverless (como Vercel o AWS), por favor consulta la carpeta de documentos:

- [Cierre Técnico MVP v1.0](./docs/mvp-v1-cierre.md)
- [Checklist Pre-Producción](./docs/checklist-produccion.md)

---
*Desarrollado con arquitectura sólida para el futuro del soporte corporativo.*
