import { Section, SectionHeader } from "./Section";
import { Button } from "@/components/ui/button";
import { CalendarCheck2, Apple, Leaf, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import produceImg from "@/assets/produce-flatlay.jpg";

export function FoodBox() {
  return (
    <Section id="foodbox">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeader
            eyebrow="Urban Food Box"
            title={<>Weekly nourishment, <span className="text-gradient-forest">grown next door.</span></>}
            description="Subscribe to a weekly box of fresh produce, eggs, and pantry staples — sourced from farms in your region and delivered by neighborhood riders."
          />

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              { name: "Family Box", price: 1450, desc: "Serves 4 · 12 items · weekly" },
              { name: "Solo Box", price: 690, desc: "Serves 1 · 6 items · weekly" },
              { name: "Protein add-on", price: 480, desc: "Eggs · beans · tilapia" },
              { name: "Pantry refill", price: 920, desc: "Maize flour · rice · oil" },
            ].map((p, i) => (
              <div
                key={p.name}
                className={`rounded-2xl border p-4 transition ${
                  i === 0
                    ? "border-forest-deep bg-forest-deep text-bone"
                    : "border-border bg-card hover:border-moss/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-display text-base">{p.name}</div>
                  {i === 0 && (
                    <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-medium text-ink">
                      Popular
                    </span>
                  )}
                </div>
                <div className={`mt-1 text-xs ${i === 0 ? "text-bone/70" : "text-muted-foreground"}`}>
                  {p.desc}
                </div>
                <div className="mt-3 font-display text-2xl tabular-nums">
                  KSh {p.price}
                  <span className={`ml-1 text-xs font-normal ${i === 0 ? "text-bone/60" : "text-muted-foreground"}`}>
                    /wk
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="forest">Start your box</Button>
            <Button variant="outline">See sample menu</Button>
          </div>
        </div>

        {/* Phone mockup */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-gold/20 via-transparent to-moss/20 blur-3xl" />
          <div className="overflow-hidden rounded-[2.5rem] border-[10px] border-ink bg-ink shadow-[var(--shadow-elevated)]">
            <div className="rounded-[1.75rem] bg-card">
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src={produceImg}
                  alt="This week's box"
                  loading="lazy"
                  width={400}
                  height={500}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent p-4 text-bone">
                  <div className="text-[10px] uppercase tracking-wider text-gold-soft">
                    Week 38 · Family Box
                  </div>
                  <div className="mt-1 font-display text-xl">12 items · 4.8kg</div>
                </div>
                <span className="absolute right-3 top-3 rounded-full bg-bone/95 px-2.5 py-1 text-[10px] font-medium text-forest-deep">
                  <Leaf className="mr-1 inline h-3 w-3" /> 92% local
                </span>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2.5 text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    <CalendarCheck2 className="h-4 w-4 text-forest" />
                    Delivery · Thu, 4–6pm
                  </span>
                  <button className="text-xs font-medium text-clay">Edit</button>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2.5 text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    <Apple className="h-4 w-4 text-clay" />
                    Family nutrition · 87
                  </span>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-bone">
                    <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-moss to-gold" />
                  </div>
                </div>
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest-deep py-2.5 text-sm font-medium text-bone">
                  <Plus className="h-4 w-4" /> Add protein box
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
