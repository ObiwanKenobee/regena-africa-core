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

export const getProposals = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("proposals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return { proposals: data ?? [] };
});

export const getSavingsCircles = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("savings_circles")
    .select("*")
    .order("balance", { ascending: false });
  if (error) throw new Error(error.message);
  return { circles: data ?? [] };
});

// ---- Authenticated ----

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

const pickRider = () => RIDERS[Math.floor(Math.random() * RIDERS.length)];

export const initiateMpesaStk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CheckoutInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const total = data.items.reduce((s, i) => s + i.price * i.qty, 0);
    const rider = pickRider();
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

// WhatsApp food box order: skip STK push, go straight to preparing.
// Mirrors how an operator would create an order from a WhatsApp conversation.
export const createWhatsAppOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CheckoutInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const total = data.items.reduce((s, i) => s + i.price * i.qty, 0);
    const rider = pickRider();

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        phone: data.phone,
        total,
        status: "preparing",
        progress: 20,
        channel: "whatsapp",
        rider: rider.name,
        route: rider.route,
        zone_id: data.zone_id ?? null,
      })
      .select()
      .single();
    if (error || !order) throw new Error(error?.message ?? "Could not create order");

    const items = data.items.map((i) => ({ ...i, order_id: order.id }));
    const { error: ie } = await supabase.from("order_items").insert(items);
    if (ie) throw new Error(ie.message);

    return { order_id: order.id, total };
  });

// ---- Profile / role ----

const ProfileInput = z.object({
  full_name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  preferred_role: z.enum(["household", "farmer", "sme", "rider"]),
});

export const upsertProfileRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ProfileInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        full_name: data.full_name ?? null,
        phone: data.phone ?? null,
        preferred_role: data.preferred_role,
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, preferred_role")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { profile: data };
  });

// ---- Wallet ----

export const getMyWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: wallet }, { data: txs }] = await Promise.all([
      supabase.from("wallets").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);
    return {
      wallet: wallet ?? { user_id: userId, balance: 0, currency: "KES" },
      transactions: txs ?? [],
    };
  });

const TopUpInput = z.object({
  amount: z.number().positive().max(1_000_000),
  memo: z.string().max(120).optional(),
});
export const topUpWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => TopUpInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("wallet_transactions").insert({
      user_id: userId,
      kind: "in",
      category: "topup",
      amount: data.amount,
      memo: data.memo ?? "M-Pesa top-up",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Governance ----

const VoteInput = z.object({
  proposal_id: z.string().uuid(),
  vote: z.boolean(),
});
export const voteOnProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => VoteInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("proposal_votes").insert({
      proposal_id: data.proposal_id,
      user_id: userId,
      vote: data.vote,
    });
    if (error) {
      // unique violation = already voted
      if (error.code === "23505") throw new Error("You have already voted on this proposal.");
      throw new Error(error.message);
    }
    return { ok: true };
  });

const ProposalInput = z.object({
  title: z.string().trim().min(4).max(140),
  body: z.string().trim().min(10).max(1000),
  zone_id: z.string().max(40).nullable().optional(),
  quorum_pct: z.number().int().min(10).max(100).default(60),
});
export const createProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ProposalInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("proposals")
      .insert({
        title: data.title,
        body: data.body,
        zone_id: data.zone_id ?? null,
        quorum_pct: data.quorum_pct,
        created_by: userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { proposal: row };
  });

export const getMyVotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("proposal_votes")
      .select("proposal_id, vote")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { votes: data ?? [] };
  });

// ---- Savings circles ----

const ContributeInput = z.object({
  circle_id: z.string().uuid(),
  amount: z.number().positive().max(1_000_000),
});
export const contributeToCircle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ContributeInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("circle_contributions").insert({
      circle_id: data.circle_id,
      user_id: userId,
      amount: data.amount,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Onboarding gating ----

export const getOnboardingStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone, preferred_role")
      .eq("id", userId)
      .maybeSingle();
    const complete = !!(data?.full_name && data?.phone && data?.preferred_role);
    return { complete, profile: data ?? null };
  });

// ---- Zone impact aggregator ----

export const getZoneImpact = createServerFn({ method: "GET" }).handler(async () => {
  const [zonesRes, proposalsRes, circlesRes, ordersRes, contribsRes] = await Promise.all([
    supabaseAdmin.from("zones").select("id, name, status, households"),
    supabaseAdmin.from("proposals").select("zone_id, status, yes_count, no_count"),
    supabaseAdmin.from("savings_circles").select("zone_id, balance"),
    supabaseAdmin.from("orders").select("zone_id, total, status"),
    supabaseAdmin.from("circle_contributions").select("amount, created_at, circle_id"),
  ]);

  const zones = zonesRes.data ?? [];
  const byZone = new Map<string, {
    id: string; name: string; status: string; households: number;
    proposals: number; votes: number;
    circle_balance: number;
    order_count: number; order_value: number;
  }>();
  for (const z of zones) {
    byZone.set(z.id, {
      id: z.id,
      name: z.name,
      status: z.status,
      households: z.households ?? 0,
      proposals: 0,
      votes: 0,
      circle_balance: 0,
      order_count: 0,
      order_value: 0,
    });
  }
  for (const p of proposalsRes.data ?? []) {
    if (!p.zone_id) continue;
    const e = byZone.get(p.zone_id);
    if (!e) continue;
    e.proposals += 1;
    e.votes += (p.yes_count ?? 0) + (p.no_count ?? 0);
  }
  for (const c of circlesRes.data ?? []) {
    if (!c.zone_id) continue;
    const e = byZone.get(c.zone_id);
    if (!e) continue;
    e.circle_balance += Number(c.balance ?? 0);
  }
  for (const o of ordersRes.data ?? []) {
    if (!o.zone_id) continue;
    const e = byZone.get(o.zone_id);
    if (!e) continue;
    e.order_count += 1;
    if (o.status === "paid" || o.status === "delivered" || o.status === "in_transit") {
      e.order_value += Number(o.total ?? 0);
    }
  }
  const totals = {
    proposals: proposalsRes.data?.length ?? 0,
    votes: (proposalsRes.data ?? []).reduce((s, p) => s + (p.yes_count ?? 0) + (p.no_count ?? 0), 0),
    circle_balance: (circlesRes.data ?? []).reduce((s, c) => s + Number(c.balance ?? 0), 0),
    contributions: (contribsRes.data ?? []).reduce((s, c) => s + Number(c.amount ?? 0), 0),
    order_value: (ordersRes.data ?? []).reduce((s, o) => s + Number(o.total ?? 0), 0),
  };
  return { zones: Array.from(byZone.values()), totals };
});


// ---- Public proposal audit feed ----
// Merges proposal lifecycle (created/status updates) with anonymized votes.
// Returns most recent 30 events in chronological order.
export const getProposalAuditTrail = createServerFn({ method: "GET" }).handler(async () => {
  const [propRes, voteRes] = await Promise.all([
    supabaseAdmin
      .from("proposals")
      .select("id, title, status, created_at, updated_at, created_by")
      .order("updated_at", { ascending: false })
      .limit(40),
    supabaseAdmin
      .from("proposal_votes")
      .select("id, proposal_id, user_id, vote, created_at")
      .order("created_at", { ascending: false })
      .limit(40),
  ]);
  if (propRes.error) throw new Error(propRes.error.message);
  if (voteRes.error) throw new Error(voteRes.error.message);

  const titles = new Map((propRes.data ?? []).map((p) => [p.id, p.title]));

  type Event = {
    id: string;
    at: string;
    kind: "created" | "status" | "voted";
    proposal_id: string;
    proposal_title: string;
    actor: string; // short, anonymized actor id
    detail: string;
  };

  const events: Event[] = [];
  for (const p of propRes.data ?? []) {
    events.push({
      id: `c-${p.id}`,
      at: p.created_at,
      kind: "created",
      proposal_id: p.id,
      proposal_title: p.title,
      actor: p.created_by ? p.created_by.slice(0, 8) : "system",
      detail: "opened for voting",
    });
    if (p.updated_at && p.updated_at !== p.created_at && p.status !== "voting") {
      events.push({
        id: `s-${p.id}-${p.status}`,
        at: p.updated_at,
        kind: "status",
        proposal_id: p.id,
        proposal_title: p.title,
        actor: "council",
        detail: `marked ${p.status}`,
      });
    }
  }
  for (const v of voteRes.data ?? []) {
    events.push({
      id: `v-${v.id}`,
      at: v.created_at,
      kind: "voted",
      proposal_id: v.proposal_id,
      proposal_title: titles.get(v.proposal_id) ?? "—",
      actor: v.user_id.slice(0, 8),
      detail: v.vote ? "voted Yes" : "voted No",
    });
  }
  events.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  return { events: events.slice(0, 30) };
});
