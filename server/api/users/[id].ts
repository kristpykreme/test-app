import { eventHandler, getRouterParam, readBody, createError } from "h3";
import bcrypt from "bcrypt";
import { prisma } from "~/server/utils/prisma";
import { requireAuth } from "~/server/utils/auth";
import { mapPrisma } from "~/server/utils/errors";

export default eventHandler(async (event) => {
  const me = requireAuth(event);
  const id = Number(getRouterParam(event, "id"));
  if (Number.isNaN(id))
    throw createError({ statusCode: 400, statusMessage: "invalid id" });

  const method = event.method;

  if (method === "GET") {
    if (me.role !== "admin" && me.sub !== id)
      throw createError({ statusCode: 403 });
    const u = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, role: { select: { name: true } } },
    });
    if (!u) throw createError({ statusCode: 404 });
    return { id: u.id, name: u.name, role: u.role.name as "admin" | "user" };
  }

  if (method === "PUT") {
    if (me.role !== "admin" && me.sub !== id)
      throw createError({ statusCode: 403 });
    const body = await readBody<{
      name?: string;
      password?: string;
      role?: "admin" | "user";
    }>(event);
    const data: Record<string, any> = {};

    if (body?.name) data.name = body.name;
    if (body?.password) data.password = await bcrypt.hash(body.password, 12);

    if (body?.role) {
      if (me.role !== "admin")
        throw createError({
          statusCode: 403,
          statusMessage: "role change forbidden",
        });
      const r = await prisma.role.findUnique({ where: { name: body.role } });
      if (!r)
        throw createError({ statusCode: 400, statusMessage: "invalid role" });
      data.roleId = r.id;
    }

    try {
      const u = await prisma.user.update({
        where: { id },
        data,
        include: { role: true },
      });
      return { id: u.id, name: u.name, role: u.role.name as "admin" | "user" };
    } catch (e) {
      mapPrisma(e);
    }
  }

  if (method === "DELETE") {
    if (me.role !== "admin") throw createError({ statusCode: 403 });
    if (me.sub === id)
      throw createError({
        statusCode: 400,
        statusMessage: "cannot delete yourself",
      });
    await prisma.user.delete({ where: { id } });
    return { ok: true };
  }

  throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});
