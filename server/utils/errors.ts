// server/utils/errors.ts
import { Prisma } from "@prisma/client";
import { createError } from "h3";

export function mapPrisma(e: unknown) {
  // Unique constraint -> 409 Username taken
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    // (optional) narrow to the "name" field
    const t = Array.isArray((e.meta as any)?.target)
      ? (e.meta as any).target
      : [(e.meta as any)?.target];
    if (t?.some((x: string) => String(x).includes("name")))
      throw createError({ statusCode: 409, statusMessage: "username taken" });
    // generic unique conflict
    throw createError({ statusCode: 409, statusMessage: "conflict" });
  }

  // Default: 500
  throw createError({ statusCode: 500, statusMessage: "Database error" });
}
