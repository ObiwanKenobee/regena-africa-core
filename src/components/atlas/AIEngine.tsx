import { Section, SectionHeader } from "./Section";
import { Brain, Sparkles, ShieldCheck, TrendingUp } from "lucide-react";

export function AIEngine() {
  return (
    <Section id="ai" dark className="bg-gradient-to-b from-forest-deep to-ink">
      <SectionHeader
        light
        eyebrow="AI + Data Engine"
        title={<>The Bloomberg terminal <span className="text-gradient-gold">for regeneration.</span></>}
        description="Forecasts, regenerative scoring, and ESG-ready reports built from on-the-ground data — not satellite guesses."
      />

      <div className="mt-12 grid gap-4 lg:grid-cols-12">
        <div className="rounded-2xl glass-dark p-6 lg:col-span-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gold-soft">
            <Brain className="h-4 w-4" /> Regenerative Score · Nairobi Cluster
          </div>
          <div className="mt-6 flex items-center gap-6">
            <div className="relative h-32 w-32">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="2.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="oklch(0.78 0.13 85)"
                  strokeWidth="2.5"
                  strokeDasharray="78 100"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-3xl text-bone">78</span>
                <span className="text-[10px] uppercase tracking-wider text-bone/60">/ 100</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ["Soil health", 84],
                ["Community equity", 76],
                ["Carbon flow", 71],
                ["Local circulation", 82],
              ].map(([k, v]) => (
                <div key={k as string} className="flex items-center gap-2">
                  <span className="w-32 text-bone/70">{k}</span>
                  <div className="h-1 w-24 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-gold" style={{ width: `${v}%` }} />
                  </div>
                  <span className="w-6 text-right text-xs text-bone/60">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl glass-dark p-6 lg:col-span-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gold-soft">
            <TrendingUp className="h-4 w-4" /> Supply / Demand Forecast · 14d
          </div>
          <div className="mt-5 h-40">
            <svg viewBox="0 0 200 100" className="h-full w-full">
              {[0, 25, 50, 75, 100].map((y) => (
                <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="oklch(1 0 0 / 0.06)" strokeWidth="0.4" />
              ))}
              <path d="M0,70 C20,60 40,50 60,55 C80,60 100,40 120,38 C140,36 160,50 200,42" fill="none" stroke="oklch(0.55 0.095 148)" strokeWidth="2" />
              <path d="M0,80 C20,72 40,68 60,62 C80,56 100,52 120,48 C140,44 160,46 200,40" fill="none" stroke="oklch(0.78 0.13 85)" strokeWidth="2" strokeDasharray="3 3" />
            </svg>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-bone/60">
            <span>Supply</span>
            <span>Demand · projected</span>
          </div>
        </div>

        <div className="rounded-2xl glass-dark p-6 lg:col-span-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gold-soft">
            <ShieldCheck className="h-4 w-4" /> ESG · Auditable
          </div>
          <div className="mt-5 space-y-3 text-sm">
            {[
              ["CO₂e avoided", "3,120 t"],
              ["Verified suppliers", "284"],
              ["Living wage rate", "91%"],
              ["Audit log entries", "1.2M"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between">
                <span className="text-bone/70">{k}</span>
                <span className="font-display text-lg text-bone tabular-nums">{v}</span>
              </div>
            ))}
          </div>
          <button className="mt-5 w-full rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-xs font-medium text-gold-soft transition hover:bg-gold/20">
            Export ESG report
          </button>
        </div>

        {/* Assistant */}
        <div className="rounded-2xl glass-dark p-6 lg:col-span-12">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gold/20 text-gold">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-gold-soft">Atlas Assistant</div>
              <div className="mt-1 text-bone">
                "Your <span className="text-gold-soft">Kibera compost stream</span> is running 18% above forecast.
                Reallocate <span className="text-gold-soft">12 tons</span> to Loitokitok Farms next week to lift
                tomato yields by an estimated <span className="text-gold-soft">9%</span>."
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {["Approve reallocation", "Notify SACCO", "Show full reasoning"].map((b, i) => (
                  <button
                    key={b}
                    className={`rounded-lg px-3 py-1.5 transition ${
                      i === 0
                        ? "bg-gold text-ink hover:bg-gold-soft"
                        : "border border-white/15 text-bone hover:bg-white/5"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
