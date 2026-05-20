import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Smartphone,
  ShieldCheck,
  Truck,
  MapPin,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAtlas, statusLabel, type OrderStatus } from "@/lib/atlas-store";
import { AtlasMark } from "@/components/atlas/AtlasMark";
import { initiateMpesaStk } from "@/lib/atlas-cloud.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout & Tracking — Atlas Sanctum" },
      { name: "description", content: "Pay with M-Pesa STK push and track your delivery in real time." },
    ],
  }),
  component: CheckoutPage,
});

const FLOW: OrderStatus[] = ["paid", "preparing", "picked", "in_transit", "delivered"];

type LiveOrder = {
  id: string;
  status: string;
  progress: number;
  total: number;
  rider: string | null;
  route: string | null;
  mpesa_receipt: string | null;
  failure_reason: string | null;
};

function CheckoutPage() {
  const { cart, cartTotal, updateQty, clearCart } = useAtlas();
  const nav = useNavigate();
  const initiate = useServerFn(initiateMpesaStk);
  const [phone, setPhone] = useState("0712345678");
  const [stage, setStage] = useState<"cart" | "stk" | "confirmed">("cart");
  const [order, setOrder] = useState<LiveOrder | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) nav({ to: "/auth", search: { redirect: "/checkout", mode: "signin" } });
    });
  }, [nav]);

  const [pollError, setPollError] = useState<string | null>(null);
  const [realtimeOk, setRealtimeOk] = useState(false);

  useEffect(() => {
    if (!order?.id) return;
    setPollError(null);
    setRealtimeOk(false);

    const applyUpdate = (o: Partial<LiveOrder>) => {
      setOrder((prev) => {
        if (!prev) return prev;
        if (o.status && o.status !== prev.status) {
          if (o.status === "paid") toast.success("M-Pesa payment confirmed");
          if (o.status === "delivered") toast.success("Delivered!");
          if (o.status === "failed") toast.error(o.failure_reason || "Payment failed");
        }
        return { ...prev, ...o };
      });
    };

    const ch = supabase
      .channel(`order-${order.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${order.id}` },
        (payload) => applyUpdate(payload.new as LiveOrder),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRealtimeOk(true);
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") setRealtimeOk(false);
      });

    // Polling fallback — always runs alongside realtime so missed events recover.
    let cancelled = false;
    const poll = async () => {
      if (cancelled || !order?.id) return;
      const { data, error } = await supabase
        .from("orders")
        .select("id,status,progress,total,rider,route,mpesa_receipt,failure_reason")
        .eq("id", order.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setPollError(error.message);
        return;
      }
      if (!data) {
        setPollError("Order not found — it may have been cancelled.");
        return;
      }
      setPollError(null);
      applyUpdate(data as LiveOrder);
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(ch);
    };
  }, [order?.id]);

  const startPay = async () => {
    if (!cart.length) return;
    setStage("stk");
    try {
      const res = await initiate({
        data: {
          phone,
          channel: "marketplace",
          items: cart.map((c) => ({ name: c.name, farm: c.farm, price: c.price, unit: c.unit, qty: c.qty })),
        },
      });
      setOrder({
        id: res.order_id,
        status: "stk_sent",
        progress: 5,
        total: res.amount,
        rider: null,
        route: null,
        mpesa_receipt: null,
        failure_reason: null,
      });
      await fetch("/api/public/mpesa/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkout_id: res.checkout_id,
          outcome: "paid",
          amount: res.amount,
          phone,
          delay_ms: 2500,
        }),
      });
      clearCart();
      setStage("confirmed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "STK push failed");
      setStage("cart");
    }
  };

  const flowIdx = order ? FLOW.indexOf(order.status as OrderStatus) : -1;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <AtlasMark className="h-7 w-7" />
            <span className="font-display text-sm">Atlas Sanctum</span>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">Dashboard</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Your basket</div>
          <h1 className="font-display text-3xl tracking-tight text-foreground">Checkout</h1>

          <div className="mt-6 rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
            {cart.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Your basket is empty. Add items from the{" "}
                  <Link to="/" hash="marketplace" className="font-medium text-forest underline">
                    marketplace
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {cart.map((i) => (
                  <li key={i.id} className="flex items-center gap-4 p-4">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{i.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {i.farm} · KSh {i.price} / {i.unit}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg border border-border">
                      <button
                        onClick={() => updateQty(i.id, i.qty - 1)}
                        className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground"
                        aria-label="Decrease"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm tabular-nums">{i.qty}</span>
                      <button
                        onClick={() => updateQty(i.id, i.qty + 1)}
                        className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground"
                        aria-label="Increase"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="w-24 text-right font-mono text-sm tabular-nums text-foreground">
                      KSh {(i.price * i.qty).toLocaleString()}
                    </div>
                    <button
                      onClick={() => updateQty(i.id, 0)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {order && (
            <div className="mt-10">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Active delivery
              </div>
              <h2 className="font-display text-xl tracking-tight text-foreground">Track in real time</h2>
              <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-[11px] text-muted-foreground">{order.id}</div>
                    <div className="text-sm font-medium text-foreground">
                      KSh {order.total.toLocaleString()}
                    </div>
                    {(order.rider || order.route) && (
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Truck className="h-3 w-3" /> {order.rider ?? "Awaiting rider"}
                        {order.route ? ` · ${order.route}` : ""}
                      </div>
                    )}
                    {order.mpesa_receipt && (
                      <div className="mt-0.5 text-[11px] font-mono text-moss">
                        Receipt: {order.mpesa_receipt}
                      </div>
                    )}
                  </div>
                  <span className="rounded-md bg-gold/15 px-2 py-0.5 text-[11px] font-medium text-clay">
                    {FLOW.includes(order.status as OrderStatus)
                      ? statusLabel(order.status as OrderStatus)
                      : order.status === "stk_sent"
                        ? "Awaiting M-Pesa PIN"
                        : order.status === "failed"
                          ? "Failed"
                          : order.status}
                  </span>
                </div>
                {flowIdx >= 0 && (
                  <>
                    <div className="mt-3 flex items-center gap-2">
                      {FLOW.map((s, i) => {
                        const reached = flowIdx >= i;
                        return (
                          <div key={s} className="flex flex-1 items-center gap-2">
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${
                                reached ? "bg-forest text-bone" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {reached ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                            </div>
                            {i < FLOW.length - 1 && (
                              <div className={`h-0.5 flex-1 ${reached ? "bg-forest" : "bg-muted"}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2 grid grid-cols-5 gap-2 text-[10px] text-muted-foreground">
                      {FLOW.map((s) => (
                        <span key={s} className="text-center">{statusLabel(s)}</span>
                      ))}
                    </div>
                  </>
                )}
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-forest to-moss transition-all duration-1000"
                    style={{ width: `${order.progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        <aside className="lg:col-span-2">
          <div className="sticky top-4 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-forest-deep to-forest p-6 text-bone shadow-[var(--shadow-elevated)]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gold-soft">
              <Smartphone className="h-4 w-4" /> M-Pesa · STK Push
            </div>
            <div className="mt-6 text-xs text-bone/70">Amount</div>
            <div className="font-display text-4xl tabular-nums">
              KSh {(order?.total ?? cartTotal).toLocaleString()}
            </div>

            <div className="mt-6 space-y-3">
              <label className="block text-xs uppercase tracking-wider text-gold-soft/80">
                Phone
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-mono text-bone outline-none focus:border-gold"
                />
              </label>
              <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-bone/80">
                <ShieldCheck className="h-3.5 w-3.5 text-moss" /> Paybill 4421000 · escrowed to farmer
              </div>
            </div>

            {stage === "cart" && (
              <Button
                variant="gold"
                size="lg"
                className="mt-6 w-full"
                disabled={!cart.length}
                onClick={startPay}
              >
                Send STK push
              </Button>
            )}

            {stage === "stk" && (
              <div className="mt-6 rounded-xl bg-bone p-4 text-ink">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Loader2 className="h-4 w-4 animate-spin text-forest" />
                  Check your phone
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter your M-Pesa PIN to confirm. We'll dispatch a rider the moment we get the
                  callback.
                </p>
              </div>
            )}

            {stage === "confirmed" && order && (
              <div className="mt-6 rounded-xl bg-bone p-4 text-ink">
                <div className="flex items-center gap-2 text-sm font-medium text-forest">
                  <CheckCircle2 className="h-4 w-4" /> Order placed · {order.id.slice(0, 8)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {order.status === "stk_sent"
                    ? "Awaiting M-Pesa confirmation…"
                    : `${order.rider ?? "A rider"} is handling your delivery.`}
                </p>
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> Updates stream live — no refresh needed.
                </div>
                <Button
                  variant="forest"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => { setStage("cart"); setOrder(null); }}
                >
                  Done <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
