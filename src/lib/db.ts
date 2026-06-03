import { PrismaClient } from "@prisma/client";

/**
 * מוסיף timeouts ארוכים יותר למחרוזת החיבור כדי לעמוד ב-cold start של Neon
 * (ה-tier החינמי משהה את ה-DB אחרי חוסר פעילות; החיבור הראשון צריך זמן להעיר אותו).
 */
function resilientUrl(raw?: string): string | undefined {
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    if (!u.searchParams.has("connect_timeout"))
      u.searchParams.set("connect_timeout", "20");
    if (!u.searchParams.has("pool_timeout"))
      u.searchParams.set("pool_timeout", "20");
    return u.toString();
  } catch {
    return raw;
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resilientUrl(process.env.DATABASE_URL),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
