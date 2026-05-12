import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed de la base de datos...");

  // Helper para upsert manual basado en un campo (ya que no son @unique en Prisma)
  async function upsertRole(name: string) {
    let role = await prisma.role.findFirst({ where: { name } });
    if (!role) role = await prisma.role.create({ data: { name } });
    return role;
  }

  // 1. Crear Roles
  const rolesData = ["JEFE", "RECTOR", "RRHH"];
  for (const name of rolesData) {
    await upsertRole(name);
  }
  console.log("✅ Roles creados");

  const roles = await prisma.role.findMany();
  const getRoleId = (name: string) => roles.find((r) => r.name === name)?.id;

  // 2. Crear Usuarios
  const password = await bcrypt.hash("password", 10);
  const usersData = [
    { email: "jefe@test.com", name: "Juan (Jefe de Área)", role_id: getRoleId("JEFE")! },
    { email: "rector@test.com", name: "Alberto (Rector)", role_id: getRoleId("RECTOR")! },
    { email: "rrhh@test.com", name: "María (RRHH)", role_id: getRoleId("RRHH")! },
  ];

  for (const user of usersData) {
    let u = await prisma.user.findUnique({ where: { email: user.email } });
    if (!u) await prisma.user.create({ data: { ...user, password } });
  }
  console.log("✅ Usuarios creados");

  // 3. Crear Facultades y Departamentos
  async function upsertFaculty(name: string) {
    let f = await prisma.faculty.findFirst({ where: { name } });
    if (!f) f = await prisma.faculty.create({ data: { name } });
    return f;
  }

  const fac1 = await upsertFaculty("Facultad de Ingeniería");
  const fac2 = await upsertFaculty("Facultad de Ciencias Económicas");

  async function upsertDepartment(name: string, faculty_id: number) {
    let d = await prisma.department.findFirst({ where: { name } });
    if (!d) d = await prisma.department.create({ data: { name, faculty_id } });
    return d;
  }

  await upsertDepartment("Departamento de Informática", fac1.id);
  await upsertDepartment("Departamento de Economía", fac2.id);
  console.log("✅ Facultades y Departamentos creados");

  // 4. Crear Grados Científicos
  async function upsertScientificDegree(name: string) {
    let d = await prisma.scientificDegree.findFirst({ where: { name } });
    if (!d) d = await prisma.scientificDegree.create({ data: { name } });
    return d;
  }

  const degrees = ["Doctor", "Máster", "Ingeniero", "Licenciado"];
  for (const degree of degrees) {
    await upsertScientificDegree(degree);
  }
  console.log("✅ Grados Científicos creados");

  // 5. Crear Categorías Docentes
  async function upsertTeachingCategory(name: string) {
    let c = await prisma.teachingCategory.findFirst({ where: { name } });
    if (!c) c = await prisma.teachingCategory.create({ data: { name } });
    return c;
  }

  const categories = ["Profesor Titular", "Profesor Auxiliar", "Asistente", "Instructor"];
  for (const cat of categories) {
    await upsertTeachingCategory(cat);
  }
  console.log("✅ Categorías Docentes creadas");

  console.log("Seed completado exitosamente.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
