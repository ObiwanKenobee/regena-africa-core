import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Home,
  Sprout,
  Store,
  Bike,
  Wallet,
  Truck,
  PackageCheck,
  Leaf,
  ShoppingBasket,
  ArrowRight,
  Recycle,
  LineChart,
  Users,
  MapPin,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAtlas, statusLabel, type Role } from "@/lib/atlas-store";
import { AtlasMark } from "@/components/atlas/AtlasMark";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Atlas Dashboard — your regenerative operations" },
      {
        name: "description",
        content:
          "A role-tailored dashboard for households, farmers, SMEs, and riders on Atlas Sanctum.",
      },
    ],
  }),
  component: DashboardPage,
});

const ROLE_META: Record<Role, { title: string; icon: typeof Home; sub: string }> = {
  household: { title: "Household", icon: Home, sub: "Family nutrition · weekly box · regen credits" },
  farmer: { title: "Farmer", icon: Sprout, sub: "Live demand · crop health · same-day payout" },
  sme: { title: "SME / SACCO", icon: Store, sub: "Procurement · SACCO ledger · working capital" },
  rider: { title: "Rider", icon: Bike, sub: "Stacked routes · earnings · settlement" },
};

function DashboardPage() {
  const navigate = useNavigate();
  const { role, lowBandwidth, setLowBandwidth, orders } = useAtlas();

  useEffect(() => {
    if (!role) navigate({ to: "/onboarding" });
  }, [role, navigate]);

  if (!role) return null;
  const Meta = ROLE_META[role];
  const Icon = Meta.icon;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <AtlasMark className="h-7 w-7" />
            <span className="font-display text-sm">Atlas Sanctum</span>
          </Link>
          <div className="flex items-center gap-2">
            <label className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <input
                type="checkbox"
                checked={lowBandwidth}
                onChange={(e) => setLowBandwidth(e.target.checked)}
                className="accent-forest"
              />
              Low-bandwidth mode
            </label>
            <Link to="/onboarding">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" /> Change role
              </Button>
            </Link>
            <Link to="/checkout">
              <Button variant="forest" size="sm">
                <ShoppingBasket className="h-4 w-4" /> Cart
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-deep text-bone">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Dashboard · {role}
                </div>
                <h1 className="font-display text-3xl tracking-tight text-foreground">
                  {Meta.title}
                </h1>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{Meta.sub}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/foodbox">
              <Button variant="outline" size="sm">WhatsApp my order</Button>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm">View live impact</Button>
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {role === "household" && <HouseholdCards />}
          {role === "farmer" && <FarmerCards />}
          {role === "sme" && <SMECards />}
          {role === "rider" && <RiderCards />}
        </div>

        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Your live orders
              </div>
              <h2 className="font-display text-2xl tracking-tight text-foreground">
                What's moving right now
              </h2>
            </div>
            <Link to="/checkout">
              <Button variant="outline" size="sm">
                Track all <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No orders yet. Add something from the{" "}
                <Link to="/" hash="marketplace" className="font-medium text-forest underline">
                  marketplace
                </Link>{" "}
                or order a{" "}
                <Link to="/foodbox" className="font-medium text-forest underline">
                  weekly food box
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {orders.slice(0, 4).map((o) => (
                <div key={o.id} className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-[11px] text-muted-foreground">{o.id}</div>
                      <div className="mt-0.5 text-sm font-medium text-foreground">
                        {o.items.length} item{o.items.length === 1 ? "" : "s"} · KSh {o.total.toLocaleString()}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Truck className="h-3 w-3" /> {o.route} · {o.rider}
                      </div>
                    </div>
                    <span className="rounded-md bg-gold/15 px-2 py-0.5 text-[11px] font-medium text-clay">
                      {statusLabel(o.status)}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-gradient-to-r from-forest to-moss transition-all duration-700"
                      style={{ width: `${o.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "moss",
}: {
  icon: typeof Home;
  label: string;
  value: string;
  sub?: string;
  tone?: "moss" | "gold" | "clay";
}) {
  const toneClass = {
    moss: "bg-moss/15 text-forest",
    gold: "bg-gold/15 text-clay",
    clay: "bg-clay/15 text-clay",
  }[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
      <div className="mt-3 font-display text-2xl text-foreground tabular-nums">{value}</div>
      <div className="text-sm text-foreground">{label}</div>
    </div>
  );
}

function ActionCard({ title, desc, to, hash, cta }: { title: string; desc: string; to: string; hash?: string; cta: string }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-gradient-to-br from-forest-deep to-forest p-5 text-bone shadow-[var(--shadow-elevated)]">
      <div className="font-display text-lg">{title}</div>
      <p className="mt-1 text-sm text-bone/75">{desc}</p>
      <div className="mt-auto pt-4">
        <Link to={to} hash={hash}>
          <Button variant="gold" size="sm">{cta} <ArrowRight className="h-3.5 w-3.5" /></Button>
        </Link>
      </div>
    </div>
  );
}

function HouseholdCards() {
  return (
    <>
      <StatCard icon={Leaf} label="Family nutrition score" value="87 / 100" sub="this week" />
      <StatCard icon={Recycle} label="Compost recycled" value="14.2 kg" sub="↑ 6%" tone="gold" />
      <StatCard icon={Wallet} label="Regen credits" value="1,240" sub="KSh 620 redeemable" tone="clay" />
      <ActionCard
        title="Order this week's food box"
        desc="12 items, 4.8kg, 92% locally sourced — delivered Thursday."
        to="/foodbox"
        cta="Order via WhatsApp"
      />
      <ActionCard
        title="Browse marketplace"
        desc="Add eggs, sukuma, and compost from farms near you."
        to="/"
        hash="marketplace"
        cta="Open marketplace"
      />
      <ActionCard
        title="Schedule a compost pickup"
        desc="Earn 1 regen credit per kg. Riders pass by your block on Tue & Fri."
        to="/dashboard"
        cta="Schedule pickup"
      />
    </>
  );
}

function FarmerCards() {
  return (
    <>
      <StatCard icon={Wallet} label="Same-day payouts (30d)" value="KSh 142,400" sub="M-Pesa" />
      <StatCard icon={LineChart} label="Sukuma demand · 7d" value="↑ 18%" sub="Nairobi + Kiambu" tone="gold" />
      <StatCard icon={Sprout} label="Crop health index" value="94" sub="IoT verified" />
      <ActionCard
        title="List today's harvest"
        desc="Quote against live buyer demand. Locked-in price, escrowed payout."
        to="/"
        hash="marketplace"
        cta="List produce"
      />
      <ActionCard
        title="Open a working-capital line"
        desc="Priced against your last 90 days of supply contracts — not collateral."
        to="/"
        hash="finance"
        cta="See offers"
      />
      <ActionCard
        title="Schedule rider pickup"
        desc="Atlas dispatches a vetted rider from your nearest hub."
        to="/dashboard"
        cta="Schedule pickup"
      />
    </>
  );
}

function SMECards() {
  return (
    <>
      <StatCard icon={Users} label="Members served" value="1,820" sub="this month" />
      <StatCard icon={Wallet} label="SACCO float" value="KSh 4.2M" sub="84% deployed" tone="gold" />
      <StatCard icon={PackageCheck} label="Open procurement RFPs" value="6" tone="clay" />
      <ActionCard
        title="Bulk procurement"
        desc="Aggregate demand across your members and clear it at a verified price."
        to="/"
        hash="marketplace"
        cta="Create RFP"
      />
      <ActionCard
        title="Working capital"
        desc="Draw against confirmed supply contracts at a transparent APR."
        to="/"
        hash="finance"
        cta="Draw funds"
      />
      <ActionCard
        title="Open governance proposal"
        desc="Put a regional policy or fee change to your members for vote."
        to="/"
        hash="governance"
        cta="Draft proposal"
      />
    </>
  );
}

function RiderCards() {
  return (
    <>
      <StatCard icon={Wallet} label="Today's earnings" value="KSh 1,840" sub="settled at 8pm" />
      <StatCard icon={Truck} label="Active stops" value="3" sub="next: Westlands" tone="gold" />
      <StatCard icon={MapPin} label="Zone" value="Nairobi · West" sub="Brian K." tone="clay" />
      <ActionCard
        title="Claim a stacked route"
        desc="Three deliveries clustered in 4km — paid as one trip."
        to="/checkout"
        cta="Open route"
      />
      <ActionCard
        title="Mark pickup complete"
        desc="Scan the QR at the hub to advance the order status for the buyer."
        to="/checkout"
        cta="Mark pickup"
      />
      <ActionCard
        title="Daily settlement"
        desc="Auto-paid to your M-Pesa at 8pm. View today's breakdown."
        to="/"
        hash="finance"
        cta="View payout"
      />
    </>
  );
}

