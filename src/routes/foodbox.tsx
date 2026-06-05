import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Wifi, WifiOff, CheckCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAtlas, statusLabel, type OrderStatus } from "@/lib/atlas-store";
import { AtlasMark } from "@/components/atlas/AtlasMark";
import { supabase } from "@/integrations/supabase/client";
import { createWhatsAppOrder } from "@/lib/atlas-cloud.functions";

export const Route = createFileRoute("/foodbox")({
  head: () => ({
    meta: [
      { title: "Order your weekly food box via WhatsApp — Atlas Sanctum" },
      {
        name: "description",
        content:
          "Order a weekly food box over WhatsApp. SMS delivery updates and a low-bandwidth fallback for 2G.",
      },
    ],
  }),
  component: FoodboxPage,
});

type Msg = { from: "atlas" | "me"; text: string; at: string; status?: "sent" | "read" };

const BOXES = [
  { id: "family", name: "Family Box", price: 1450, desc: "Serves 4 · 12 items" },
  { id: "solo", name: "Solo Box", price: 690, desc: "Serves 1 · 6 items" },
  { id: "protein", name: "Protein add-on", price: 480, desc: "Eggs · beans · tilapia" },
];

const PROGRESS_BY_STATUS: Record<string, number> = {
  pending: 5,
  stk_sent: 15,
  paid: 30,
  preparing: 45,
  picked: 65,
  in_transit: 85,
  delivered: 100,
  failed: 0,
  cancelled: 0,
};

const now = () =>
  new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: false });

type LiveOrder = {
  id: string;
  status: string;
  progress: number;
  rider: string | null;
  route: string | null;
  total: number;
  source: "db" | "local";
};

function FoodboxPage() {
  const { placeOrder, advanceOrder, orders, lowBandwidth, setLowBandwidth } = useAtlas();
  const createOrderFn = useServerFn(createWhatsAppOrder);

  const [userId, setUserId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: "atlas",
      text: "Habari! Karibu Atlas Food Box 🌱 Reply with a number to start:\n1 · Family Box  KSh 1,450\n2 · Solo Box  KSh 690\n3 · Protein add-on  KSh 480",
      at: now(),
    },
  ]);
  const [draft, setDraft] = useState("");
  const [liveOrder, setLiveOrder] = useState<LiveOrder | null>(null);
  const [phase, setPhase] = useState<"choose" | "address" | "pay" | "tracking">("choose");
  const [selectedBox, setSelectedBox] = useState<typeof BOXES[number] | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setUserId(s?.user.id ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  // Local-store fallback for guests
  const localOrder = orders.find((o) => o.id === liveOrder?.id);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  // Subscribe to persisted order status via Supabase Realtime (authed orders only)
  useEffect(() => {
    if (!liveOrder || liveOrder.source !== "db") return;
    const orderId = liveOrder.id;
    const ch = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          setLiveOrder((prev) =>
            prev
              ? {
                  ...prev,
                  status: String(row.status ?? prev.status),
                  progress:
                    typeof row.progress === "number"
                      ? row.progress
                      : PROGRESS_BY_STATUS[String(row.status ?? prev.status)] ?? prev.progress,
                  rider: (row.rider as string | null) ?? prev.rider,
                  route: (row.route as string | null) ?? prev.route,
                }
              : prev,
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [liveOrder?.id, liveOrder?.source]);

  // SMS-style delivery updates: append a chat msg whenever tracked order status changes
  const lastStatusRef = useRef<string | null>(null);
  const trackedStatus = liveOrder?.status ?? localOrder?.status ?? null;
  const trackedRider = liveOrder?.rider ?? localOrder?.rider ?? "Brian K.";
  const trackedRoute = liveOrder?.route ?? localOrder?.route ?? "Atlas Hub";
  const trackedId = liveOrder?.id ?? localOrder?.id ?? "";

  useEffect(() => {
    if (!trackedStatus || !trackedId) return;
    if (lastStatusRef.current === trackedStatus) return;
    lastStatusRef.current = trackedStatus;
    const lines: Record<string, string> = {
      paid: `Asante 🌱 Payment received. Order ${trackedId.slice(0, 8)} confirmed.`,
      preparing: `📦 Hub is packing your box. ETA 35 min.`,
      picked: `🛵 ${trackedRider} picked up your box from ${trackedRoute.split(" → ")[0]}.`,
      in_transit: `🚦 Rider is 12 min away. Track: m.atlas.ke/b/${trackedId.slice(-4)}`,
      delivered: `✅ Delivered at ${now()}. Karibu tena. Reply RATE to leave feedback.`,
      failed: `⚠️ Payment failed. Reply RETRY to try again.`,
    };
    const text = lines[trackedStatus];
    if (text) push("atlas", text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackedStatus, trackedId]);

  const push = (from: "atlas" | "me", text: string) =>
    setMsgs((m) => [...m, { from, text, at: now(), status: from === "me" ? "read" : undefined }]);

  const confirmPayment = async () => {
    if (!selectedBox) return;
    const items = [
      {
        id: selectedBox.id,
        name: selectedBox.name,
        farm: "Atlas Hub · Westlands",
        price: selectedBox.price,
        unit: "wk",
        qty: 1,
      },
    ];
    if (userId) {
      try {
        const res = await createOrderFn({
          data: { items, phone: "0711000000", channel: "whatsapp" },
        });
        setLiveOrder({
          id: res.order_id,
          status: "preparing",
          progress: PROGRESS_BY_STATUS.preparing,
          rider: "Brian K.",
          route: "Westlands Hub → You",
          total: res.total,
          source: "db",
        });
        setPhase("tracking");
        return;
      } catch (e) {
        push("atlas", `Couldn't save your order to the network (${(e as Error).message}). Falling back to local tracking.`);
      }
    }
    const o = placeOrder({
      items,
      total: selectedBox.price,
      phone: "07••• ••• •••",
      rider: "Brian K.",
      route: "Westlands Hub → You",
      channel: "whatsapp",
    });
    setLiveOrder({
      id: o.id,
      status: o.status,
      progress: o.progress,
      rider: o.rider,
      route: o.route,
      total: o.total,
      source: "local",
    });
    setPhase("tracking");
  };

  const handleSend = (raw?: string) => {
    const text = (raw ?? draft).trim();
    if (!text) return;
    push("me", text);
    setDraft("");

    setTimeout(() => {
      const lower = text.toLowerCase();
      if (phase === "choose") {
        const idx = ["1", "family"].some((k) => lower.includes(k))
          ? 0
          : ["2", "solo"].some((k) => lower.includes(k))
            ? 1
            : ["3", "protein"].some((k) => lower.includes(k))
              ? 2
              : -1;
        if (idx === -1) {
          push("atlas", "Sorry, reply with 1, 2 or 3 to pick a box.");
          return;
        }
        const b = BOXES[idx];
        setSelectedBox(b);
        push(
          "atlas",
          `Nice — ${b.name} (KSh ${b.price}/wk). What's your delivery estate + nearest landmark?`,
        );
        setPhase("address");
      } else if (phase === "address") {
        push(
          "atlas",
          `Sawa. Pay KSh ${selectedBox!.price} via M-Pesa Paybill 4421000, account ATLAS. Reply 1 once you've paid.`,
        );
        setPhase("pay");
      } else if (phase === "pay") {
        void confirmPayment();
      } else {
        push("atlas", "I'll keep you posted on each step. Reply HELP for support.");
      }
    }, 600);
  };

  const displayOrder = liveOrder
    ? {
        id: liveOrder.id,
        status: liveOrder.status as OrderStatus,
        progress: liveOrder.progress,
        source: liveOrder.source,
      }
    : null;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <AtlasMark className="h-7 w-7" />
            <span className="font-display text-sm">Atlas Sanctum</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLowBandwidth(!lowBandwidth)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted"
              aria-pressed={lowBandwidth}
            >
              {lowBandwidth ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
              {lowBandwidth ? "Low bandwidth ON" : "Low bandwidth OFF"}
            </button>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" /> Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-5">
        <section className="lg:col-span-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">WhatsApp ordering</div>
          <h1 className="mt-1 font-display text-3xl tracking-tight text-foreground">
            One chat. One food box. <span className="text-gradient-forest">Every week.</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Subscribe to a weekly box, pay with M-Pesa, and get SMS-style updates as your rider
            moves. Works on 2G.
          </p>
          {!userId && (
            <p className="mt-2 text-xs text-clay">
              Sign in to save your order to the network and get realtime status updates.
            </p>
          )}

          <div className="mt-6 space-y-2">
            {BOXES.map((b, i) => (
              <button
                key={b.id}
                onClick={() => handleSend(String(i + 1))}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left hover:border-moss/40"
              >
                <div>
                  <div className="text-sm font-medium text-foreground">{b.name}</div>
                  <div className="text-xs text-muted-foreground">{b.desc}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm tabular-nums text-foreground">KSh {b.price}</div>
                  <div className="text-[10px] text-muted-foreground">tap to order</div>
                </div>
              </button>
            ))}
          </div>

          {displayOrder && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
                <span>Live order</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] normal-case tracking-normal">
                  {displayOrder.source === "db" ? "realtime · network" : "local demo"}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <div className="font-mono text-sm text-foreground">{displayOrder.id.slice(0, 12)}</div>
                <span className="rounded-md bg-gold/15 px-2 py-0.5 text-[11px] font-medium text-clay">
                  {statusLabel(displayOrder.status)}
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-to-r from-forest to-moss transition-all duration-700"
                  style={{ width: `${displayOrder.progress}%` }}
                />
              </div>
              {displayOrder.source === "local" && displayOrder.status !== "delivered" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => advanceOrder(displayOrder.id)}
                >
                  Simulate next update
                </Button>
              )}
              {displayOrder.source === "db" && (
                <p className="mt-3 text-center text-[11px] text-muted-foreground">
                  Updates stream live from the operations console.
                </p>
              )}
            </div>
          )}
        </section>

        {/* Chat */}
        <section className="lg:col-span-3">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-elevated)]">
            <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-bone">
              <div className="h-9 w-9 rounded-full bg-forest" />
              <div className="leading-tight">
                <div className="text-sm font-medium">Atlas Sanctum</div>
                <div className="text-[11px] text-bone/70">+254 711 ATLAS · online</div>
              </div>
            </div>
            <div
              ref={scrollRef}
              className="h-[440px] space-y-2 overflow-y-auto bg-[#e5ddd5] p-4"
            >
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${
                      m.from === "me"
                        ? "rounded-br-md bg-[#dcf8c6] text-ink"
                        : "rounded-bl-md bg-white text-ink"
                    }`}
                  >
                    {m.text}
                    <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-ink/50">
                      {m.at}
                      {m.from === "me" && <CheckCheck className="h-3 w-3 text-[#34b7f1]" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2 border-t border-border bg-card p-3"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm outline-none focus:border-ring"
              />
              <Button type="submit" variant="forest" size="sm">Send</Button>
            </form>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Demo conversation · SMS fallback works the same when WhatsApp is offline.
          </p>
        </section>
      </main>
    </div>
  );
}
