import { readSession, verify } from "~/server/utils/jwt";
import { defineEventHandler, createError } from "h3";
export default defineEventHandler((event) => {
  const token = readSession(event);
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  try {
    const p = verify(token);
    return { ok: true, user: { id: p.sub, name: p.name, role: p.role } };
  } catch {
    // bad/expired token
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
});
