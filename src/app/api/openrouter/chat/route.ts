import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    requireAuth(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, model, context } = await req.json();

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const selectedModel = model ?? "openai/gpt-4o";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";

  const systemPrompt = context
    ? `You are an AI assistant for SeeWhy LIVE, a live streaming platform.${
        context.watchPartyId ? ` You are assisting with watch party ID: ${context.watchPartyId}.` : ""
      }${
        context.videoTitle ? ` The current video is: "${context.videoTitle}".` : ""
      } Be helpful, concise, and relevant to the live streaming context.`
    : "You are an AI assistant for SeeWhy LIVE, a live streaming platform. Be helpful and concise.";

  const upstream = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": appUrl,
      "X-Title": "SeeWhy LIVE",
    },
    body: JSON.stringify({
      model: selectedModel,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    }),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    console.error("[openrouter]", upstream.status, err);
    return NextResponse.json(
      { error: "Upstream AI error", detail: err },
      { status: upstream.status }
    );
  }

  // Stream the response directly to the client
  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
