import { createError, type H3Event } from "h3";
import { readSession, verify } from "~/server/utils/jwt";

export type AuthUser = { sub: number; name: string; role: "admin" | "user" };

export function getAuth(event: H3Event): AuthUser | null {
  const token = readSession(event);
  if (!token) return null;
  try {
    return verify(token) as AuthUser;
  } catch {
    return null;
  }
}

export function requireAuth(
  event: H3Event,
  roles?: Array<"admin" | "user">
): AuthUser {
  const u = getAuth(event);
  if (!u) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  if (roles && !roles.includes(u.role))
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  return u;
}
