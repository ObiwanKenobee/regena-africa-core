import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// Stand-in for Safaricom's Daraja. In production this endpoint goes away;
// Safaricom posts directly to /api/public/mpesa/callback. For the prototype
// the client (or server) calls this to fire a realistic callback after a
// short delay.
const Input = z.object({
  checkout_id: z.string().min(4).max(64),
  outcome: z.enum(["paid", "failed", "cancelled"]).default("paid"),
  amount: z.number().positive().max(10_000_000).default(0),
  phone: z.string().min(7).max(20).default("254700000000"),
  delay_ms: z.number().int().min(0).max(15000).default(2500),
});

export const Route = createFileRoute("/api/public/mpesa/simulate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = Input.parse(await request.json());

        const callbackUrl = new URL("/api/public/mpesa/callback", request.url).toString();
        const payload =
          body.outcome === "paid"
            ? {
                Body: {
                  stkCallback: {
                    MerchantRequestID: "mock-" + body.checkout_id,
                    CheckoutRequestID: body.checkout_id,
                    ResultCode: 0,
                    ResultDesc: "The service request is processed successfully.",
                    CallbackMetadata: {
                      Item: [
                        { Name: "Amount", Value: body.amount },
                        { Name: "MpesaReceiptNumber", Value: "M" + Math.random().toString(36).slice(2, 12).toUpperCase() },
                        { Name: "PhoneNumber", Value: body.phone },
                      ],
                    },
                  },
                },
              }
            : {
                Body: {
                  stkCallback: {
                    MerchantRequestID: "mock-" + body.checkout_id,
                    CheckoutRequestID: body.checkout_id,
                    ResultCode: body.outcome === "cancelled" ? 1032 : 1037,
                    ResultDesc:
                      body.outcome === "cancelled"
                        ? "Request cancelled by user"
                        : "DS timeout user cannot be reached",
                  },
                },
              };

        // Fire-and-forget: schedule the callback POST after delay_ms.
        // We don't block the response — mirrors how Safaricom's webhook arrives async.
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (process.env.MPESA_CALLBACK_SECRET) {
          headers["x-mpesa-secret"] = process.env.MPESA_CALLBACK_SECRET;
        }
        const fire = async () => {
          if (body.delay_ms) await new Promise((r) => setTimeout(r, body.delay_ms));
          try {
            await fetch(callbackUrl, { method: "POST", headers, body: JSON.stringify(payload) });
          } catch (e) {
            console.error("[mpesa.simulate] callback fire failed", e);
          }
        };
        // ctx.waitUntil isn't exposed cleanly here; awaiting keeps the request alive
        // long enough for the dev server. For prototype this is fine.
        void fire();

        return Response.json({ scheduled: true, in_ms: body.delay_ms });
      },
    },
  },
});
