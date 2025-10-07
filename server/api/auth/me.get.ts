import { eventHandler, createError } from "h3";
import { readSession, verify } from "~~/server/utils/jwt";

export default eventHandler((event) => {
  const token = readSession(event);
  if (!token) throw createError({ statusCode: 401 });
  const p = verify(token);
  return { ok: true, user: { id: p.sub, name: p.name, role: p.role } };
});
