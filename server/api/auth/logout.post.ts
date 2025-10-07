import { eventHandler } from "h3";
import { clearSessionCookie } from "~~/server/utils/jwt";
export default eventHandler((event) => {
  clearSessionCookie(event);
  return { ok: true };
});
