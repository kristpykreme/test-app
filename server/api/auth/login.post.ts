import { eventHandler, readBody, createError } from "h3";
import bcrypt from "bcrypt";
import { prisma } from "~~/server/utils/prisma";
import { sign, setSessionCookie } from "~~/server/utils/jwt";

export default eventHandler(async (event) => {
  const body = await readBody<{ name: string; password: string }>(event);
  if (!body?.name || !body?.password)
    throw createError({
      statusCode: 400,
      statusMessage: "Missing name/password",
    });

  const user = await prisma.user.findFirst({
    where: { name: body.name },
    include: { role: true },
  });
  if (!user || !(await bcrypt.compare(body.password, user.password)))
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid credentials",
    });

  const token = sign({ sub: user.id, name: user.name, role: user.role.name });
  setSessionCookie(event, token);
  return {
    ok: true,
    user: { id: user.id, name: user.name, role: user.role.name },
  };
});
