import { useEffect, useState } from "react";
import { Section, SectionHeader } from "./Section";
import { Users, Recycle, Truck, Leaf, Cloud, Wallet } from "lucide-react";

const metrics = [
  { icon: Users, label: "Households Connected", value: 48230, suffix: "", delta: "+312 this week", color: "moss" },
  { icon: Recycle, label: "Tons of Waste Recycled", value: 1847, suffix: "t", delta: "+42 this week", color: "forest" },
  { icon: Truck, label: "Weekly Food Deliveries", value: 9420, suffix: "", delta: "+8% MoM", color: "clay" },
  { icon: Users, label: "Youth Jobs Created", value: 1284, suffix: "", delta: "+96 this month", color: "gold" },
  { icon: Cloud, label: "CO₂e Avoided", value: 3120, suffix: "t", delta: "verified", color: "moss" },
  { icon: Wallet, label: "Farmer Revenue (KSh)", value: 184_500_000, suffix: "", delta: "+12% QoQ", color: "gold", money: true },
];

function useCount(target: number, run: boolean, dur = 1400) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.floor(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, dur]);
  return n;
}

function MetricCard({ m, run, i }: { m: typeof metrics[number]; run: boolean; i: number }) {
  const n = useCount(m.value, run);
  const display = m.money
    ? "KSh " + (n / 1_000_000).toFixed(1) + "M"
    : n.toLocaleString() + m.suffix;
  const Icon = m.icon;
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-elevated)]"
      style={{ animationDelay: `${i * 60}ms` }}
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gold/10 blur-2xl transition group-hover:bg-gold/20" />
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-deep/5 text-forest-deep">
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-md bg-moss/10 px-2 py-0.5 text-[11px] font-medium text-forest">
          {m.delta}
        </span>
      </div>
      <div className="mt-6 font-display text-3xl font-medium tracking-tight text-foreground tabular-nums md:text-4xl">
        {display}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{m.label}</div>
    </div>
  );
}

const zones = [
  { name: "Nairobi", x: 62, y: 58, size: 24, active: 18420 },
  { name: "Kiambu", x: 58, y: 52, size: 12, active: 6210 },
  { name: "Nakuru", x: 48, y: 48, size: 16, active: 9340 },
  { name: "Kisumu", x: 28, y: 50, size: 14, active: 7820 },
  { name: "Eldoret", x: 38, y: 38, size: 10, active: 4180 },
  { name: "Mombasa", x: 82, y: 80, size: 12, active: 5620 },
  { name: "Nyeri", x: 60, y: 44, size: 8, active: 2640 },
];

export function ImpactDashboard() {
  const [run, setRun] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setRun(true)),
      { threshold: 0.2 }
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
        description="Every kilogram, kilowatt, and shilling that flows through Atlas is tracked, verified, and shared back with the communities creating it."
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m, i) => (
          <MetricCard key={m.label} m={m} run={run} i={i} />
        ))}
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
              <Leaf className="h-3.5 w-3.5 text-moss" /> 7 active counties
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
              {/* Stylized Kenya outline */}
              <path
                d="M22,30 L40,24 L58,28 L72,22 L86,30 L88,46 L82,60 L88,76 L78,86 L62,84 L46,82 L30,78 L20,66 L18,48 Z"
                fill="oklch(0.34 0.07 152 / 0.12)"
                stroke="oklch(0.34 0.07 152 / 0.4)"
                strokeWidth="0.4"
              />
              {zones.map((z) => (
                <g key={z.name}>
                  <circle
                    cx={z.x}
                    cy={z.y}
                    r={z.size / 8}
                    fill="oklch(0.78 0.13 85 / 0.25)"
                    className="animate-pulse-ring"
                    style={{ transformOrigin: `${z.x}px ${z.y}px` }}
                  />
                  <circle cx={z.x} cy={z.y} r={z.size / 14} fill="oklch(0.78 0.13 85)" />
                  <text x={z.x + 2} y={z.y - 1.5} fontSize="2.4" fill="oklch(0.24 0.045 155)" fontFamily="Inter">
                    {z.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Zone Activity · 24h
          </div>
          <div className="mt-4 space-y-3">
            {zones.slice(0, 5).map((z, i) => {
              const pct = (z.active / 20000) * 100;
              return (
                <div key={z.name}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">{z.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {z.active.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-forest to-gold transition-all duration-1000"
                      style={{ width: run ? `${pct}%` : "0%", transitionDelay: `${i * 100}ms` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
            Sources: SACCOs, partner farms, last-mile rider logs
          </div>
        </div>
      </div>
    </Section>
  );
}
