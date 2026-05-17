import { Section, SectionHeader } from "./Section";
import { Sprout, Egg, Boxes, Satellite, CloudRain, TrendingUp } from "lucide-react";

const cropRows = [
  ["Sukuma wiki · Kangemi A", 92, "Healthy", "moss"],
  ["Tomatoes · Loitokitok 3", 76, "Watch", "gold"],
  ["Maize · Nakuru West", 88, "Healthy", "moss"],
  ["Spinach · Kibera Roof", 64, "Pest risk", "clay"],
];

export function FarmOps() {
  return (
    <Section id="farms">
      <SectionHeader
        eyebrow="Farm & Supply Chain"
        title={<>Operational truth, <span className="text-gradient-forest">field to fork.</span></>}
        description="A unified dashboard for the people actually growing the food — crop health, inventory, harvest forecasts, compost output, and supply allocation."
      />

      <div className="mt-12 grid gap-4 lg:grid-cols-12">
        {/* Main panel */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] lg:col-span-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Crop Health · Live IoT + Satellite
              </div>
              <div className="mt-1 flex items-center gap-2 font-display text-xl text-foreground">
                <Satellite className="h-4 w-4 text-moss" /> 12 plots monitored
              </div>
            </div>
            <select className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm">
              <option>This week</option>
              <option>This month</option>
            </select>
          </div>

          {/* Mini chart */}
          <div className="mt-6 h-40 w-full">
            <svg viewBox="0 0 400 120" className="h-full w-full">
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="oklch(0.55 0.095 148)" stopOpacity="0.4" />
                  <stop offset="1" stopColor="oklch(0.55 0.095 148)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 30, 60, 90, 120].map((y) => (
                <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="oklch(0.88 0.018 100)" strokeWidth="0.5" />
              ))}
              <path
                d="M0,80 C40,72 60,40 100,48 C140,56 160,30 200,28 C240,26 260,52 300,46 C340,40 360,20 400,18 L400,120 L0,120 Z"
                fill="url(#cg)"
              />
              <path
                d="M0,80 C40,72 60,40 100,48 C140,56 160,30 200,28 C240,26 260,52 300,46 C340,40 360,20 400,18"
                fill="none"
                stroke="oklch(0.34 0.07 152)"
                strokeWidth="2"
              />
              <path
                d="M0,96 C40,92 80,88 120,82 C160,76 200,72 240,68 C280,64 320,62 360,58 L400,56"
                fill="none"
                stroke="oklch(0.78 0.13 85)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </svg>
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-forest" /> Yield index
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gold" /> Forecast
            </span>
          </div>

          <div className="mt-6 divide-y divide-border rounded-xl border border-border">
            {cropRows.map(([name, score, status, color]) => (
              <div key={name as string} className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-moss/10 text-forest">
                    <Sprout className="h-4 w-4" />
                  </div>
                  <div className="text-sm font-medium text-foreground">{name}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full bg-${color}`}
                      style={{ width: `${score}%`, background: `var(--${color === "moss" ? "moss" : color === "gold" ? "gold" : "clay"})` }}
                    />
                  </div>
                  <span className="w-10 text-right font-mono text-sm tabular-nums text-foreground">
                    {score}
                  </span>
                  <span
                    className="hidden rounded-md px-2 py-0.5 text-[10px] font-medium md:inline-block"
                    style={{
                      background: `color-mix(in oklab, var(--${color === "moss" ? "moss" : color === "gold" ? "gold" : "clay"}) 15%, transparent)`,
                      color: `var(--${color === "moss" ? "forest" : color === "gold" ? "clay" : "clay"})`,
                    }}
                  >
                    {status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4 lg:col-span-4">
          {[
            { icon: Egg, label: "Egg production · today", value: "8,420", delta: "+312 trays", sub: "12 producer farms" },
            { icon: Boxes, label: "Compost output · MTD", value: "62 t", delta: "+18%", sub: "Kibera + Mathare" },
            { icon: CloudRain, label: "Rainfall forecast", value: "Above avg", delta: "Next 14d", sub: "Central Kenya" },
            { icon: TrendingUp, label: "Harvest window", value: "Sep 22 – Oct 4", delta: "Optimal", sub: "Sukuma · 6 plots" },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-deep text-bone">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="rounded-md bg-moss/10 px-2 py-0.5 text-[10px] font-medium text-forest">
                    {c.delta}
                  </span>
                </div>
                <div className="mt-3 font-display text-2xl text-foreground">{c.value}</div>
                <div className="text-sm text-foreground">{c.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{c.sub}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
