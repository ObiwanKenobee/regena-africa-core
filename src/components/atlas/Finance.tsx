import { Section, SectionHeader } from "./Section";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Coins,
  Building2,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import {
  getMyWallet,
  topUpWallet,
  getSavingsCircles,
  contributeToCircle,
} from "@/lib/atlas-cloud.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { OnboardingGate } from "./OnboardingGate";

function FinanceInner() {
  const qc = useQueryClient();
  const walletFn = useServerFn(getMyWallet);
  const topUpFn = useServerFn(topUpWallet);
  const circlesFn = useServerFn(getSavingsCircles);
  const contribFn = useServerFn(contributeToCircle);

  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setUserId(s?.user.id ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const walletQ = useQuery({
    queryKey: ["wallet", userId],
    queryFn: () => walletFn(),
    enabled: !!userId,
  });
  const circlesQ = useQuery({ queryKey: ["circles"], queryFn: () => circlesFn() });

  // Realtime
  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`wallet-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey: ["wallet", userId] }),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "wallet_transactions", filter: `user_id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey: ["wallet", userId] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "savings_circles" }, () =>
        qc.invalidateQueries({ queryKey: ["circles"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, qc]);

  const topUp = useMutation({
    mutationFn: (amount: number) => topUpFn({ data: { amount, memo: "Simulated M-Pesa top-up" } }),
    onSuccess: () => toast.success("Top-up received"),
    onError: (e: Error) => toast.error(e.message),
  });
  const contribute = useMutation({
    mutationFn: (v: { circle_id: string; amount: number }) => contribFn({ data: v }),
    onSuccess: () => toast.success("Contribution recorded"),
    onError: (e: Error) => toast.error(e.message),
  });

  const balance = Number(walletQ.data?.wallet?.balance ?? 0);
  const txs = walletQ.data?.transactions ?? [];
  const circles = circlesQ.data?.circles ?? [];

  return (
    <Section id="finance" className="bg-muted/30">
      <SectionHeader
        eyebrow="Finance & Micro-economy"
        title={<>Money that <span className="text-gradient-forest">stays in the neighborhood.</span></>}
        description="Wallets, micro-payments, SACCO savings, and regenerative credits — all settled in shillings and accessible from any phone."
      />

      <div className="mt-12 grid gap-4 lg:grid-cols-12">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-forest-deep to-forest p-6 text-bone shadow-[var(--shadow-elevated)] lg:col-span-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gold-soft">
              <Wallet className="h-4 w-4" /> Atlas Wallet · KE
            </div>
            <div className="h-6 w-10 rounded bg-gold/30" />
          </div>

          {!userId ? (
            <>
              <div className="mt-8 font-display text-4xl tracking-tight tabular-nums text-bone/40">
                KSh ••••••
              </div>
              <div className="mt-1 text-xs text-bone/60">Sign in to open your wallet</div>
              <Link to="/auth" search={{ redirect: "/", mode: "signin" }}>
                <Button variant="gold" size="sm" className="mt-5">Sign in</Button>
              </Link>
            </>
          ) : walletQ.isLoading ? (
            <div className="mt-8 flex items-center gap-2 text-bone/70">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading wallet…
            </div>
          ) : (
            <>
              <div className="mt-8 font-display text-4xl tracking-tight tabular-nums">
                KSh {balance.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-xs text-bone/60">Linked: M-Pesa · auto-settled</div>

              <div className="mt-6 grid grid-cols-3 gap-2">
                <button
                  onClick={() => topUp.mutate(500)}
                  disabled={topUp.isPending}
                  className="flex flex-col items-center gap-1.5 rounded-xl bg-white/5 py-3 text-xs text-bone transition hover:bg-white/10 disabled:opacity-50"
                >
                  <ArrowDownLeft className="h-4 w-4 text-gold-soft" />
                  +KSh 500
                </button>
                <button
                  onClick={() => topUp.mutate(2000)}
                  disabled={topUp.isPending}
                  className="flex flex-col items-center gap-1.5 rounded-xl bg-white/5 py-3 text-xs text-bone transition hover:bg-white/10 disabled:opacity-50"
                >
                  <ArrowDownLeft className="h-4 w-4 text-gold-soft" />
                  +KSh 2,000
                </button>
                <Link
                  to="/"
                  hash="marketplace"
                  className="flex flex-col items-center gap-1.5 rounded-xl bg-white/5 py-3 text-xs text-bone transition hover:bg-white/10"
                >
                  <ArrowUpRight className="h-4 w-4 text-gold-soft" />
                  Spend
                </Link>
              </div>

              <div className="mt-6 divide-y divide-white/10 rounded-xl bg-white/[0.04]">
                {txs.length === 0 && (
                  <div className="px-4 py-6 text-center text-xs text-bone/60">
                    No transactions yet. Tap a top-up button above to start.
                  </div>
                )}
                {txs.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <div className="text-bone">{t.memo ?? t.category}</div>
                      <div className="text-xs text-bone/50 capitalize">{t.category}</div>
                    </div>
                    <div
                      className={`font-mono tabular-nums ${
                        t.kind === "in" ? "text-moss" : "text-gold-soft"
                      }`}
                    >
                      {t.kind === "in" ? "+" : "−"}KSh {Number(t.amount).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="grid gap-4 lg:col-span-7 lg:grid-cols-2">
          <div className="col-span-full rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15 text-clay">
                  <PiggyBank className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">Savings circles (SACCO)</div>
                  <div className="text-xs text-muted-foreground">Table banking, digitized</div>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {circlesQ.isLoading ? "…" : `${circles.length} active`}
              </span>
            </div>

            <div className="mt-4 divide-y divide-border">
              {circles.map((c: any) => {
                const pct = c.target > 0 ? Math.min(100, Math.round((Number(c.balance) / Number(c.target)) * 100)) : 0;
                return (
                  <div key={c.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{c.name}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="h-1 w-28 overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-moss" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="tabular-nums">
                          KSh {Number(c.balance).toLocaleString()} / {Number(c.target).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {userId ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={contribute.isPending}
                        onClick={() =>
                          contribute.mutate({ circle_id: c.id, amount: Number(c.contribution_amount) })
                        }
                      >
                        +KSh {Number(c.contribution_amount).toLocaleString()}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sign in</span>
                    )}
                  </div>
                );
              })}
              {circles.length === 0 && !circlesQ.isLoading && (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No circles yet. An admin can create one.
                </div>
              )}
            </div>
          </div>

          {[
            { icon: Coins, title: "Regenerative Credits", value: "12,840", sub: "verified · Q3", body: "Earn credits for compost, recycling, and verified carbon flows." },
            { icon: Building2, title: "SME Financing", value: "KSh 42M", sub: "deployed · 96 SMEs", body: "Working capital priced against real supply contracts, not collateral." },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15 text-clay">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs text-muted-foreground">{c.sub}</span>
                </div>
                <div className="mt-3 font-display text-2xl text-foreground tracking-tight">{c.value}</div>
                <div className="text-sm font-medium text-foreground">{c.title}</div>
                <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.body}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

export function Finance() {
  return (
    <OnboardingGate
      id="finance"
      eyebrow="Finance & Micro-economy"
      title={<>Money that <span className="text-gradient-forest">stays in the neighborhood.</span></>}
      description="Wallets, micro-payments, SACCO savings, and regenerative credits — all settled in shillings and accessible from any phone."
    >
      <FinanceInner />
    </OnboardingGate>
  );
}

