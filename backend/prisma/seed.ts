import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('password', 10)

  const roles = [
    { email: 'admin@test.com', full_name: 'Administrador Prueba', role: 'JEFE' },
    { email: 'rector@test.com', full_name: 'Dr. Alberto Rector', role: 'RECTOR' },
    { email: 'rh@test.com', full_name: 'Maria Perez (RH)', role: 'RH' },
  ]

  for (const r of roles) {
    const existingUser = await prisma.profile.findUnique({
      where: { email: r.email }
    })
    
    if (!existingUser) {
      await prisma.profile.create({
        data: {
          email: r.email,
          password: password,
          full_name: r.full_name,
          role: r.role as any,
        }
      })
      console.log(`Created user: ${r.email}`)
    }
  }

  // Create one draft request using the JEFE user
  const jefeUser = await prisma.profile.findUnique({ where: { email: 'admin@test.com' }})
  
  if (jefeUser) {
    const existingSolicitud = await prisma.solicitud.findFirst()
    if (!existingSolicitud) {
      await prisma.solicitud.create({
        data: {
          created_by: jefeUser.id,
          estado: 'DRAFT',
          nombres_apellidos: "Juan Pérez",
          ci: "90010123456",
          direccion: "Calle 123",
          jubilado: false,
          categoria_docente: "Profesor Auxiliar",
          grado_cientifico: "Doctor",
          asignaturas: "Programación I",
        }
      })
      console.log('Created sample DRAFT application')
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
