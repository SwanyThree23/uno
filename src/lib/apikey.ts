import crypto from "crypto";
import { prisma } from "./prisma";

/**
 * Generate a new API key: sw_ + 48 hex chars
 */
export function generateRawKey(): string {
  return "sw_" + crypto.randomBytes(24).toString("hex");
}

/**
 * Hash an API key for storage (one-way)
 */
export function hashKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Validate an incoming API key against the database.
 * Returns the userId if valid, null otherwise.
 */
export async function validateApiKey(raw: string): Promise<string | null> {
  if (!raw.startsWith("sw_")) return null;
  const hashed = hashKey(raw);
  const record = await prisma.apiKey.findUnique({ where: { keyHash: hashed } });
  if (!record) return null;

  // Update last used timestamp (fire-and-forget)
  prisma.apiKey.update({
    where: { id: record.id },
    data: { lastUsed: new Date() },
  }).catch(() => {});

  return record.userId;
}
