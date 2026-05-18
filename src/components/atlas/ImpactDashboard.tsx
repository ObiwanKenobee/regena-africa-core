import { useEffect, useState } from "react";
import { Section, SectionHeader } from "./Section";
import { Users, Recycle, Truck, Leaf, Cloud, Wallet } from "lucide-react";
import { ZONES, useAtlas } from "@/lib/atlas-store";

function useCount(target: number, run: boolean, dur = 1200) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    const from = n;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.floor(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, run, dur]);
  return n;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  delta,
  run,
  money,
  suffix,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  delta: string;
  run: boolean;
  money?: boolean;
  suffix?: string;
}) {
  const n = useCount(value, run);
  const display = money
    ? "KSh " + (n / 1_000_000).toFixed(1) + "M"
    : n.toLocaleString() + (suffix ?? "");
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-elevated)]">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gold/10 blur-2xl transition group-hover:bg-gold/20" />
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-deep/5 text-forest-deep">
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-md bg-moss/10 px-2 py-0.5 text-[11px] font-medium text-forest">
          {delta}
        </span>
      </div>
      <div className="mt-6 font-display text-3xl font-medium tracking-tight text-foreground tabular-nums md:text-4xl">
        {display}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export function ImpactDashboard() {
  const [run, setRun] = useState(false);
  const { selectedZone, setSelectedZone } = useAtlas();
  const zone = ZONES.find((z) => z.id === selectedZone) ?? ZONES[0];

  // Network totals
  const totals = ZONES.reduce(
    (a, z) => ({
      households: a.households + z.households,
      waste: a.waste + z.waste,
      deliveries: a.deliveries + z.deliveries,
      jobs: a.jobs + z.jobs,
      co2: a.co2 + z.co2,
      revenue: a.revenue + z.revenue,
    }),
    { households: 0, waste: 0, deliveries: 0, jobs: 0, co2: 0, revenue: 0 },
  );

  // If a non-default zone is selected, show that zone's metrics; otherwise totals.
  const showZone = selectedZone !== "all";
  const m = showZone ? zone : totals;

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setRun(true)),
      { threshold: 0.2 },
    );
    const el = document.getElementById("impact");
    if (el) io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Section id="impact">
      <SectionHeader
        eyebrow="Live Impact"
        title="The economy, measured honestly."
        description="Click any zone on the map to see what's flowing through that county right now. Every kilogram, kilowatt, and shilling is tracked, verified, and shared back."
      />

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedZone("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            selectedZone === "all"
              ? "bg-forest-deep text-bone"
              : "border border-border text-foreground hover:bg-muted"
          }`}
        >
          All Kenya
        </button>
        {ZONES.map((z) => (
          <button
            key={z.id}
            onClick={() => setSelectedZone(z.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              selectedZone === z.id
                ? "bg-forest-deep text-bone"
                : "border border-border text-foreground hover:bg-muted"
            }`}
          >
            {z.name}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          Viewing: <span className="font-medium text-foreground">{showZone ? zone.name : "All Kenya"}</span>
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard icon={Users} label="Households Connected" value={m.households} delta="+312 wk" run={run} />
        <MetricCard icon={Recycle} label="Tons of Waste Recycled" value={m.waste} suffix="t" delta="+42 wk" run={run} />
        <MetricCard icon={Truck} label="Weekly Food Deliveries" value={m.deliveries} delta="+8% MoM" run={run} />
        <MetricCard icon={Users} label="Youth Jobs Created" value={m.jobs} delta="+96 mo" run={run} />
        <MetricCard icon={Cloud} label="CO₂e Avoided" value={m.co2} suffix="t" delta="verified" run={run} />
        <MetricCard icon={Wallet} label="Producer Revenue" value={m.revenue} delta="+12% QoQ" run={run} money />
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Active Regenerative Zones
              </div>
              <div className="mt-1 font-display text-xl text-foreground">Kenya · Live Map</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Leaf className="h-3.5 w-3.5 text-moss" /> {ZONES.length} active counties
            </div>
          </div>
          <div className="relative mt-5 aspect-[5/4] w-full overflow-hidden rounded-xl bg-gradient-to-br from-forest-deep/5 to-moss/10">
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
              <defs>
                <pattern id="grid" width="6" height="6" patternUnits="userSpaceOnUse">
                  <path d="M 6 0 L 0 0 0 6" fill="none" stroke="oklch(0.34 0.07 152 / 0.08)" strokeWidth="0.2" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
              <path
                d="M22,30 L40,24 L58,28 L72,22 L86,30 L88,46 L82,60 L88,76 L78,86 L62,84 L46,82 L30,78 L20,66 L18,48 Z"
                fill="oklch(0.34 0.07 152 / 0.12)"
                stroke="oklch(0.34 0.07 152 / 0.4)"
                strokeWidth="0.4"
              />
              {ZONES.map((z) => {
                const active = selectedZone === z.id;
                return (
                  <g
                    key={z.id}
                    onClick={() => setSelectedZone(z.id)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={z.x}
                      cy={z.y}
                      r={z.size / 8}
                      fill={active ? "oklch(0.78 0.13 85 / 0.5)" : "oklch(0.78 0.13 85 / 0.25)"}
                      className="animate-pulse-ring"
                      style={{ transformOrigin: `${z.x}px ${z.y}px` }}
                    />
                    <circle
                      cx={z.x}
                      cy={z.y}
                      r={active ? z.size / 10 : z.size / 14}
                      fill={active ? "oklch(0.55 0.115 45)" : "oklch(0.78 0.13 85)"}
                      stroke={active ? "oklch(0.24 0.045 155)" : "transparent"}
                      strokeWidth="0.6"
                    />
                    <text
                      x={z.x + 2}
                      y={z.y - 1.5}
                      fontSize="2.4"
                      fill="oklch(0.24 0.045 155)"
                      fontFamily="Inter"
                      fontWeight={active ? 600 : 400}
                    >
                      {z.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Zone Activity · 24h
            </div>
            <span className="rounded-md bg-moss/15 px-2 py-0.5 text-[10px] font-medium uppercase text-forest">
              {showZone ? zone.status : "live"}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {ZONES.map((z, i) => {
              const pct = (z.households / 20000) * 100;
              const active = selectedZone === z.id;
              return (
                <button
                  key={z.id}
                  onClick={() => setSelectedZone(z.id)}
                  className={`w-full rounded-lg p-2 text-left transition ${
                    active ? "bg-forest-deep/5" : "hover:bg-muted"
                  }`}
                >
                  <div className="flex justify-between text-sm">
                    <span className={`font-medium ${active ? "text-forest-deep" : "text-foreground"}`}>
                      {z.name}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {z.households.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-forest to-gold transition-all duration-1000"
                      style={{
                        width: run ? `${pct}%` : "0%",
                        transitionDelay: `${i * 100}ms`,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
            Click any zone to refocus the dashboard metrics above.
          </div>
        </div>
      </div>
    </Section>
  );
}
