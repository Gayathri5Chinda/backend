import { PrismaClient } from "../generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

let prisma: ReturnType<typeof createPrisma> | undefined;

function createPrisma(accelerateUrl: string) {
  return new PrismaClient({ accelerateUrl }).$extends(withAccelerate());
}

export function getPrisma(accelerateUrl: string) {
  if (!accelerateUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  prisma ??= createPrisma(accelerateUrl);
  return prisma;
}

export type Prisma = ReturnType<typeof getPrisma>;