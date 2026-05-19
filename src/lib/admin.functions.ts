import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { orders: data ?? [] };
  });

const StatusInput = z.object({
  order_id: z.string().uuid(),
  status: z.enum([
    "pending",
    "stk_sent",
    "paid",
    "preparing",
    "picked",
    "in_transit",
    "delivered",
    "failed",
    "cancelled",
  ]),
});

const PROGRESS_MAP: Record<string, number> = {
  pending: 0,
  stk_sent: 5,
  paid: 20,
  preparing: 40,
  picked: 60,
  in_transit: 80,
  delivered: 100,
  failed: 0,
  cancelled: 0,
};

export const adminSetOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => StatusInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: data.status, progress: PROGRESS_MAP[data.status] ?? 0 })
      .eq("id", data.order_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ZoneInput = z.object({
  id: z.string().min(1).max(40),
  name: z.string().min(1).max(80),
  x: z.number().int().min(0).max(100),
  y: z.number().int().min(0).max(100),
  size: z.number().int().min(4).max(40),
  households: z.number().int().min(0),
  waste: z.number().min(0),
  deliveries: z.number().int().min(0),
  jobs: z.number().int().min(0),
  co2: z.number().min(0),
  revenue: z.number().min(0),
  status: z.enum(["online", "scaling", "pilot"]),
});

export const adminUpsertZone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => ZoneInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("zones").upsert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ListingInput = z.object({
  id: z.string().uuid().optional(),
  zone_id: z.string().max(40).nullable().optional(),
  farm: z.string().min(1).max(120),
  name: z.string().min(1).max(120),
  price: z.number().positive().max(1_000_000),
  unit: z.string().min(1).max(24),
  image: z.string().url().nullable().optional(),
  active: z.boolean().default(true),
});

export const adminUpsertListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => ListingInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("listings").upsert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("listings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    return { isAdmin: !!data?.some((r) => r.role === "admin"), roles: data?.map((r) => r.role) ?? [] };
  });
