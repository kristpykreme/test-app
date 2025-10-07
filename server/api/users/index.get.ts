import { eventHandler } from "h3";
import { prisma } from "~/server/utils/prisma";
import { requireAuth } from "~/server/utils/auth";

export default eventHandler(async (event) => {
  requireAuth(event);
  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: { select: { name: true } } },
    orderBy: { id: "asc" },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role.name as "admin" | "user",
  }));
});
