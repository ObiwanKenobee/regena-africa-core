import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Mock Daraja callback. Shape mirrors Safaricom's STK callback so swapping to
// real Daraja later is a credentials change, not a code rewrite.
//
// Real payload extract:
// {
//   Body: { stkCallback: {
//     MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc,
//     CallbackMetadata?: { Item: [{Name:"Amount",Value:...},{Name:"MpesaReceiptNumber",Value:"..."},{Name:"PhoneNumber",Value:...}] }
//   }}
// }
const Callback = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string().optional(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z
        .object({
          Item: z.array(z.object({ Name: z.string(), Value: z.union([z.string(), z.number()]).optional() })),
        })
        .optional(),
    }),
  }),
});

export const Route = createFileRoute("/api/public/mpesa/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        let parsed;
        try {
          parsed = Callback.parse(JSON.parse(raw));
        } catch (e) {
          console.error("[mpesa.callback] invalid payload", e);
          return Response.json({ ResultCode: 1, ResultDesc: "Invalid payload" }, { status: 400 });
        }
        // Shared-secret header check (works for real Daraja behind a proxy too)
        const expected = process.env.MPESA_CALLBACK_SECRET;
        if (expected) {
          const got = request.headers.get("x-mpesa-secret");
          if (got !== expected) {
            return Response.json({ ResultCode: 1, ResultDesc: "Unauthorized" }, { status: 401 });
          }
        }

        const cb = parsed.Body.stkCallback;
        const items = cb.CallbackMetadata?.Item ?? [];
        const receipt = items.find((i) => i.Name === "MpesaReceiptNumber")?.Value?.toString() ?? null;

        const success = cb.ResultCode === 0;
        const update = success
          ? { status: "paid" as const, progress: 20, mpesa_receipt: receipt, failure_reason: null }
          : { status: "failed" as const, progress: 0, failure_reason: cb.ResultDesc };

        const { error } = await supabaseAdmin
          .from("orders")
          .update(update)
          .eq("mpesa_checkout_id", cb.CheckoutRequestID);
        if (error) {
          console.error("[mpesa.callback] update failed", error);
          return Response.json({ ResultCode: 1, ResultDesc: error.message }, { status: 500 });
        }

        return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
      },
    },
  },
});
