import { eventHandler, readBody, createError } from "h3";
import bcrypt from "bcrypt";
import { prisma } from "~/server/utils/prisma";
import { requireAuth } from "~/server/utils/auth";
import { mapPrisma } from "~/server/utils/errors";

export default eventHandler(async (event) => {
  requireAuth(event, ["admin"]);
  const body = await readBody<{
    name: string;
    password: string;
    role: "admin" | "user";
  }>(event);
  if (!body?.name || !body?.password || !body?.role)
    throw createError({
      statusCode: 400,
      statusMessage: "name, password, role required",
    });

  try {
    const role = await prisma.role.findUnique({ where: { name: body.role } });
    if (!role)
      throw createError({ statusCode: 400, statusMessage: "invalid role" });

    const hash = await bcrypt.hash(body.password, 12);
    const u = await prisma.user.create({
      data: { name: body.name, password: hash, roleId: role.id },
      include: { role: true },
    });
    return { id: u.id, name: u.name, role: u.role.name as "admin" | "user" };
  } catch (e) {
    mapPrisma(e);
  }
});
