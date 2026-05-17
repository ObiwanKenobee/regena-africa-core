import { Section, SectionHeader } from "./Section";
import { Home, Trash2, Recycle, Sprout, ArrowRight, Zap } from "lucide-react";

const steps = [
  { icon: Home, title: "Households", body: "Sorted at source · 32,400 active" },
  { icon: Trash2, title: "Collection", body: "Youth riders · 6 zones" },
  { icon: Recycle, title: "Sorting & Processing", body: "Compost · Briquettes · Recycling" },
  { icon: Sprout, title: "Back to Farms", body: "Soil regenerated · loop closed" },
];

export function WasteFlow() {
  return (
    <Section id="waste" className="bg-muted/30">
      <SectionHeader
        eyebrow="Waste-to-Value"
        title={<>Nothing is waste. <span className="text-gradient-forest">Only inputs in the wrong place.</span></>}
        description="A circular loop that turns kitchen scraps into compost, briquettes, and clean energy — feeding farms and households back into the same network."
      />

      <div className="mt-14 rounded-3xl border border-border bg-card p-6 md:p-10 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="flex flex-1 items-center gap-3">
                <div className="flex flex-1 flex-col rounded-2xl border border-border bg-gradient-to-br from-card to-muted/40 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-deep text-bone">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 font-display text-lg text-foreground">{s.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{s.body}</div>
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden h-5 w-5 flex-none text-clay lg:block" />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Recycled this month", value: "184 t", icon: Recycle },
            { label: "Briquettes produced", value: "21,400", icon: Zap },
            { label: "Compost sold to farms", value: "62 t", icon: Sprout },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="flex items-center justify-between rounded-xl bg-forest-deep/5 px-4 py-3">
                <div>
                  <div className="font-display text-2xl text-forest-deep">{c.value}</div>
                  <div className="text-xs text-muted-foreground">{c.label}</div>
                </div>
                <Icon className="h-5 w-5 text-moss" />
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
