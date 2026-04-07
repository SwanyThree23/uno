import crypto from "crypto";
import { prisma } from "./prisma";

export type WebhookTrigger =
  | "stream.started"
  | "stream.ended"
  | "viewer.joined"
  | "viewer.left"
  | "chat.message"
  | "tip.received"
  | "ticket.purchased"
  | "subscriber.new"
  | "room.created"
  | "watchparty.started";

export interface WebhookPayload {
  trigger: WebhookTrigger;
  timestamp: string;
  roomId?: string;
  userId: string;
  data: Record<string, unknown>;
}

/**
 * Generate a 64-char hex signing secret
 */
export function generateSigningSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Sign a webhook payload body
 */
export function signPayload(body: string, secret: string): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
}

/**
 * Fire all active outbound webhooks matching the trigger for a given userId
 */
export async function fireWebhooks(
  userId: string,
  trigger: WebhookTrigger,
  payload: Omit<WebhookPayload, "trigger" | "timestamp">
): Promise<void> {
  const webhooks = await prisma.outboundWebhook.findMany({
    where: { userId, active: true },
  });

  const matching = webhooks.filter((wh) =>
    (wh.triggers as string).split(",").includes(trigger)
  );

  if (matching.length === 0) return;

  const fullPayload: WebhookPayload = {
    trigger,
    timestamp: new Date().toISOString(),
    ...payload,
  };
  const body = JSON.stringify(fullPayload);

  await Promise.allSettled(
    matching.map(async (wh) => {
      const deliveryId = crypto.randomUUID();
      const signature = signPayload(body, wh.signingSecret);

      let statusCode: number | undefined;
      let success = false;

      try {
        const res = await fetch(wh.targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-SeeWhy-Signature": signature,
            "X-SeeWhy-Event": trigger,
            "X-SeeWhy-Delivery": deliveryId,
            "User-Agent": "SeeWhyLIVE-Webhook/1.0",
          },
          body,
          signal: AbortSignal.timeout(10_000),
        });
        statusCode = res.status;
        success = res.ok;
      } catch {
        // delivery failed — logged below
      }

      await prisma.webhookDelivery.create({
        data: {
          webhookId: wh.id,
          eventType: trigger,
          deliveryId,
          payload: body,
          statusCode,
          success,
        },
      });
    })
  );
}
