import jwt from "jsonwebtoken";
import { getCookie, setCookie, type H3Event } from "h3";

type Payload = { sub: number; name: string; role: string };
const COOKIE = "session";
const secret = () => (process.env.JWT_SECRET || "dev-secret") as string;

const baseCookie = (event: H3Event) => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
  };
};

export function sign(p: Payload) {
  return jwt.sign(p, secret(), { algorithm: "HS256", expiresIn: "7d" });
}

export function verify(token: string): Payload {
  return jwt.verify(token, secret()) as unknown as Payload;
}

export function setSessionCookie(event: H3Event, token: string) {
  setCookie(event, COOKIE, token, {
    ...baseCookie(event),
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearSessionCookie(event: H3Event) {
  setCookie(event, COOKIE, "", {
    ...baseCookie(event),
    maxAge: 0,
    expires: new Date(0), // <- ensure removal
  });
}

export const readSession = (e: H3Event) => getCookie(e, COOKIE);
