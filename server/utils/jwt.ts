import jwt from "jsonwebtoken";
import { getCookie, setCookie, type H3Event } from "h3";

const COOKIE = "session";
type Payload = { sub: number; name: string; role: string };
const secret = () => (process.env.JWT_SECRET || "dev-secret") as string;

export const sign = (p: Payload) =>
  jwt.sign(p, secret(), { algorithm: "HS256", expiresIn: "7d" });

export const verify = (t: string): Payload =>
  jwt.verify(t, secret()) as unknown as Payload;

export function setSessionCookie(event: H3Event, token: string) {
  const isProd = process.env.NODE_ENV === "production";
  setCookie(event, COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}
export function clearSessionCookie(event: H3Event) {
  const isProd = process.env.NODE_ENV === "production";
  setCookie(event, COOKIE, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
export const readSession = (e: H3Event) => getCookie(e, COOKIE);
