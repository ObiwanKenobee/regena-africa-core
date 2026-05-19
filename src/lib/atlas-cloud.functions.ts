import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---- Public reads (use admin client, scoped by query) ----

export const getZones = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("zones")
    .select("*")
    .order("revenue", { ascending: false });
  if (error) throw new Error(error.message);
  return { zones: data ?? [] };
});

export const getListings = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("listings")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return { listings: data ?? [] };
});

// ---- Authenticated: orders ----

const CartItem = z.object({
  listing_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(120),
  farm: z.string().min(1).max(120),
  price: z.number().positive().max(1_000_000),
  unit: z.string().min(1).max(24),
  qty: z.number().int().min(1).max(99),
});

const CheckoutInput = z.object({
  phone: z.string().min(7).max(20),
  items: z.array(CartItem).min(1).max(40),
  channel: z.enum(["marketplace", "whatsapp"]).default("marketplace"),
  zone_id: z.string().max(40).nullable().optional(),
});

const RIDERS = [
  { name: "Brian K.", route: "Kangemi → Westlands" },
  { name: "Achieng' O.", route: "Kibera → Kilimani" },
  { name: "Peter M.", route: "Nakuru → Naivasha" },
  { name: "Faith W.", route: "Kawangware → Lavington" },
];

export const initiateMpesaStk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CheckoutInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const total = data.items.reduce((s, i) => s + i.price * i.qty, 0);
    const rider = RIDERS[Math.floor(Math.random() * RIDERS.length)];
    const checkoutId = "ws_CO_" + Math.random().toString(36).slice(2, 12).toUpperCase();

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        phone: data.phone,
        total,
        status: "stk_sent",
        progress: 5,
        channel: data.channel,
        rider: rider.name,
        route: rider.route,
        mpesa_checkout_id: checkoutId,
        zone_id: data.zone_id ?? null,
      })
      .select()
      .single();
    if (error || !order) throw new Error(error?.message ?? "Could not create order");

    const items = data.items.map((i) => ({ ...i, order_id: order.id }));
    const { error: ie } = await supabase.from("order_items").insert(items);
    if (ie) throw new Error(ie.message);

    return { order_id: order.id, checkout_id: checkoutId, amount: total };
  });
