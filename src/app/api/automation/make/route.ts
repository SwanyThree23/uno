import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateRawKey, hashKey } from "@/lib/apikey";

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const { action, name } = await req.json();

    if (action !== "generate_key") {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const rawKey = generateRawKey();
    const keyHash = hashKey(rawKey);
    const keyPrefix = rawKey.slice(0, 10);

    await prisma.apiKey.create({
      data: {
        userId: payload.userId,
        name,
        keyHash,
        keyPrefix,
      },
    });

    return NextResponse.json({
      apiKey: rawKey,
      prefix: keyPrefix,
      name,
      note: "Save this key immediately — it will not be shown again.",
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const keys = await prisma.apiKey.findMany({
      where: { userId: payload.userId },
      select: { id: true, name: true, keyPrefix: true, lastUsed: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ keys });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
