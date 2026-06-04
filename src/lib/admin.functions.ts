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

async function logAction(
  actorId: string,
  action: string,
  fields: { target_user_id?: string | null; target_id?: string | null; amount?: number | null; memo?: string | null; metadata?: any },
) {
  await supabaseAdmin.from("admin_actions").insert({
    actor_id: actorId,
    action,
    target_user_id: fields.target_user_id ?? null,
    target_id: fields.target_id ?? null,
    amount: fields.amount ?? null,
    memo: fields.memo ?? null,
    metadata: fields.metadata ?? null,
  });
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
    await logAction(context.userId, "order.status", { target_id: data.order_id, memo: data.status });
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
    await logAction(context.userId, "zone.upsert", { target_id: data.id, memo: data.name });
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
    await logAction(context.userId, "listing.upsert", { target_id: data.id ?? null, memo: data.name });
    return { ok: true };
  });

export const adminDeleteListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("listings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAction(context.userId, "listing.delete", { target_id: data.id });
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

// ---- Economy admin ----

export const adminListProfiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone, preferred_role, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { profiles: data ?? [] };
  });

const TopUpInput = z.object({
  user_id: z.string().uuid(),
  amount: z.number().positive().max(1_000_000),
  memo: z.string().max(200).optional(),
});
export const adminTopUpUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => TopUpInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("wallet_transactions").insert({
      user_id: data.user_id,
      kind: "in",
      category: "admin-topup",
      amount: data.amount,
      memo: data.memo ?? "Admin top-up",
    });
    if (error) throw new Error(error.message);
    await logAction(context.userId, "wallet.topup", {
      target_user_id: data.user_id,
      amount: data.amount,
      memo: data.memo,
    });
    return { ok: true };
  });

const ContribInput = z.object({
  user_id: z.string().uuid(),
  circle_id: z.string().uuid(),
  amount: z.number().positive().max(1_000_000),
});
export const adminAddContribution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => ContribInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("circle_contributions").insert({
      circle_id: data.circle_id,
      user_id: data.user_id,
      amount: data.amount,
    });
    if (error) throw new Error(error.message);
    await logAction(context.userId, "circle.contribute", {
      target_user_id: data.user_id,
      target_id: data.circle_id,
      amount: data.amount,
    });
    return { ok: true };
  });

const CircleInput = z.object({
  name: z.string().min(2).max(120),
  contribution_amount: z.number().positive().max(1_000_000),
  contribution_period: z.enum(["weekly", "monthly"]).default("weekly"),
  target: z.number().min(0).max(100_000_000).default(0),
  zone_id: z.string().max(40).nullable().optional(),
});
export const adminCreateCircle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => CircleInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: row, error } = await supabaseAdmin
      .from("savings_circles")
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await logAction(context.userId, "circle.create", { target_id: row.id, memo: data.name });
    return { circle: row };
  });

const ProposalStatusInput = z.object({
  proposal_id: z.string().uuid(),
  status: z.enum(["voting", "passed", "rejected", "executed"]),
});
export const adminSetProposalStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => ProposalStatusInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("proposals")
      .update({ status: data.status })
      .eq("id", data.proposal_id);
    if (error) throw new Error(error.message);
    await logAction(context.userId, "proposal.status", {
      target_id: data.proposal_id,
      memo: data.status,
    });
    return { ok: true };
  });

export const adminListAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("admin_actions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { entries: data ?? [] };
  });

export const adminListProposals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("proposals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { proposals: data ?? [] };
  });
