import { Section, SectionHeader } from "./Section";
import { Wallet, ArrowDownLeft, ArrowUpRight, PiggyBank, Coins, Building2 } from "lucide-react";

const tx = [
  { name: "Mama Atieno · SACCO contribution", amount: "+1,200", type: "in", time: "2m" },
  { name: "Kangemi Co-op · sukuma payout", amount: "+4,840", type: "in", time: "18m" },
  { name: "Brian K. · rider settlement", amount: "−620", type: "out", time: "1h" },
  { name: "Compost loan · auto-repayment", amount: "−2,100", type: "out", time: "3h" },
  { name: "Regen credit · verified carbon", amount: "+780", type: "in", time: "yesterday" },
];

export function Finance() {
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
          <div className="mt-8 font-display text-4xl tracking-tight tabular-nums">
            KSh 24,380<span className="text-2xl text-bone/60">.50</span>
          </div>
          <div className="mt-1 text-xs text-bone/60">Linked: 0712 ••• 442 · M-Pesa</div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              { icon: ArrowDownLeft, label: "Receive" },
              { icon: ArrowUpRight, label: "Pay" },
              { icon: PiggyBank, label: "Save" },
            ].map((b) => {
              const Icon = b.icon;
              return (
                <button
                  key={b.label}
                  className="flex flex-col items-center gap-1.5 rounded-xl bg-white/5 py-3 text-xs text-bone transition hover:bg-white/10"
                >
                  <Icon className="h-4 w-4 text-gold-soft" />
                  {b.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6 divide-y divide-white/10 rounded-xl bg-white/[0.04]">
            {tx.map((t) => (
              <div key={t.name} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <div className="text-bone">{t.name}</div>
                  <div className="text-xs text-bone/50">{t.time} ago</div>
                </div>
                <div
                  className={`font-mono tabular-nums ${
                    t.type === "in" ? "text-moss" : "text-gold-soft"
                  }`}
                >
                  KSh {t.amount}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:col-span-7 lg:grid-cols-2">
          {[
            {
              icon: PiggyBank,
              title: "SACCO Savings",
              value: "KSh 184M",
              sub: "1,240 active groups",
              body: "Table banking digitized — contributions, loans, and dividends in one ledger.",
            },
            {
              icon: Coins,
              title: "Regenerative Credits",
              value: "12,840",
              sub: "verified · Q3 2025",
              body: "Earn credits for compost, recycling, and verified carbon flows. Spend at partners.",
            },
            {
              icon: Building2,
              title: "SME Financing",
              value: "KSh 42M",
              sub: "deployed · 96 SMEs",
              body: "Working capital priced against real supply contracts, not collateral.",
            },
            {
              icon: ArrowUpRight,
              title: "Impact Pools",
              value: "8 funds",
              sub: "blended capital",
              body: "Aggregate philanthropic + commercial capital into regional regenerative funds.",
            },
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
