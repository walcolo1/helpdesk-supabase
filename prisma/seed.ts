import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando el proceso de seed...')

  // 0. Usuario Base (Admin)
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  await prisma.user.upsert({
    where: { email: 'admin@helpdesk.local' },
    update: {},
    create: {
      name: 'Administrador del Sistema',
      email: 'admin@helpdesk.local',
      password: hashedPassword,
      role: 'admin',
      department: 'Sistemas',
    },
  })

  // 1. Categoría: Hardware
  const hardwareCategory = await prisma.category.upsert({
    where: { name: 'Hardware' },
    update: {},
    create: {
      name: 'Hardware',
      description: 'Problemas físicos con equipos de cómputo, impresoras y periféricos.',
      color: '#ef4444', // Rojo
      sortOrder: 1,
    },
  })

  // Servicios para Hardware
  await prisma.service.upsert({
    where: {
      categoryId_name: {
        categoryId: hardwareCategory.id,
        name: 'Reparación de PC / Laptop',
      },
    },
    update: {},
    create: {
      categoryId: hardwareCategory.id,
      name: 'Reparación de PC / Laptop',
      description: 'Asistencia para equipos que no encienden, fallas de hardware, etc.',
      slaHours: 48,
      defaultPriority: 'medium',
      sortOrder: 1,
    },
  })

  await prisma.service.upsert({
    where: {
      categoryId_name: {
        categoryId: hardwareCategory.id,
        name: 'Mantenimiento de Impresora',
      },
    },
    update: {},
    create: {
      categoryId: hardwareCategory.id,
      name: 'Mantenimiento de Impresora',
      description: 'Problemas de impresión, atasco de papel o solicitud de tóner.',
      slaHours: 24,
      defaultPriority: 'low',
      sortOrder: 2,
    },
  })

  // 2. Categoría: Software
  const softwareCategory = await prisma.category.upsert({
    where: { name: 'Software' },
    update: {},
    create: {
      name: 'Software',
      description: 'Instalación de programas, errores de sistema y licencias.',
      color: '#3b82f6', // Azul
      sortOrder: 2,
    },
  })

  // Servicios para Software
  await prisma.service.upsert({
    where: {
      categoryId_name: {
        categoryId: softwareCategory.id,
        name: 'Instalación de Programas',
      },
    },
    update: {},
    create: {
      categoryId: softwareCategory.id,
      name: 'Instalación de Programas',
      description: 'Solicitud de instalación de software autorizado corporativo.',
      slaHours: 24,
      defaultPriority: 'medium',
      sortOrder: 1,
    },
  })

  await prisma.service.upsert({
    where: {
      categoryId_name: {
        categoryId: softwareCategory.id,
        name: 'Error de Sistema Operativo',
      },
    },
    update: {},
    create: {
      categoryId: softwareCategory.id,
      name: 'Error de Sistema Operativo',
      description: 'Pantallas azules, lentitud extrema o mal funcionamiento de Windows.',
      slaHours: 8,
      defaultPriority: 'high',
      sortOrder: 2,
    },
  })

  // 3. Categoría: Accesos y Cuentas
  const accountsCategory = await prisma.category.upsert({
    where: { name: 'Accesos y Cuentas' },
    update: {},
    create: {
      name: 'Accesos y Cuentas',
      description: 'Gestión de contraseñas, correos electrónicos y permisos de red.',
      color: '#10b981', // Verde
      sortOrder: 3,
    },
  })

  // Servicios para Accesos y Cuentas
  await prisma.service.upsert({
    where: {
      categoryId_name: {
        categoryId: accountsCategory.id,
        name: 'Restablecimiento de Contraseña',
      },
    },
    update: {},
    create: {
      categoryId: accountsCategory.id,
      name: 'Restablecimiento de Contraseña',
      description: 'Restablecimiento para correo corporativo, Active Directory o sistemas internos.',
      slaHours: 2,
      defaultPriority: 'high',
      sortOrder: 1,
    },
  })

  // 4. Dominios permitidos iniciales
  await prisma.allowedEmailDomain.upsert({
    where: { domain: 'ejercito.mil.co' },
    update: {},
    create: {
      domain: 'ejercito.mil.co',
      description: 'Dominio institucional del Ejército Nacional de Colombia',
      isActive: true,
    },
  })

  console.log('Seed ejecutado correctamente. Base de datos inicializada con Usuario, Categorías, Servicios y Dominios.')
}

main()
  .catch((e) => {
    console.error('Error durante la ejecución del seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
