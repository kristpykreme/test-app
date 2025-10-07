import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
const prisma = new PrismaClient();

async function main() {
  if (!process.env.ALLOW_ADMIN_BOOTSTRAP) {
    console.log("Skipping admin bootstrap (ALLOW_ADMIN_BOOTSTRAP not set)");
    return;
  }
  const name = process.env.INIT_ADMIN_NAME || "admin";
  const pw = process.env.INIT_ADMIN_PW;
  if (!pw) throw new Error("INIT_ADMIN_PW env var required");

  const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });
  if (!adminRole) throw new Error("Seed roles first");

  const existing = await prisma.user.findFirst({ where: { name } });
  if (existing) {
    console.log("Admin exists; skipping.");
    return;
  }

  const hash = await bcrypt.hash(pw, 12);
  await prisma.user.create({
    data: { name, password: hash, roleId: adminRole.id },
  });
  console.log(`Created admin "${name}".`);
}
main().finally(() => prisma.$disconnect());
