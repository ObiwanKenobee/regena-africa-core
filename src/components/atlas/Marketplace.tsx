import { Section, SectionHeader } from "./Section";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Truck, CheckCircle2, Smartphone } from "lucide-react";
import produceImg from "@/assets/produce-flatlay.jpg";

const listings = [
  { name: "Sukuma Wiki · Bunch", farm: "Kangemi Co-op", price: 35, unit: "kg", stock: "420 kg", tag: "Organic" },
  { name: "Free-range Eggs · Tray", farm: "Nakuru Egg Collective", price: 480, unit: "tray", stock: "180 trays", tag: "Verified" },
  { name: "Compost · Grade A", farm: "Kibera Recovery", price: 22, unit: "kg", stock: "2.1 t", tag: "Recycled" },
  { name: "Tomatoes · Crate", farm: "Loitokitok Farms", price: 1200, unit: "crate", stock: "62 crates", tag: "Fresh" },
];

const filters = ["All", "Produce", "Compost", "Eggs & Protein", "Grains", "Delivery"];

export function Marketplace() {
  return (
    <Section id="marketplace" className="bg-muted/30">
      <div className="grid items-end gap-8 lg:grid-cols-2">
        <SectionHeader
          eyebrow="Multi-sided Marketplace"
          title={<>One marketplace. <span className="text-gradient-forest">Every link in the chain.</span></>}
          description="Farms, households, SMEs, recyclers, and riders trade on the same operational rails — with live pricing, logistics, and M-Pesa settlement."
        />
        <div className="flex items-center gap-2 lg:justify-end">
          <Button variant="outline">Sell on Atlas</Button>
          <Button variant="forest">Browse marketplace</Button>
        </div>
      </div>

      <div className="mt-12 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-elevated)]">
        {/* App chrome */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-clay/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-gold/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-moss/60" />
            <span className="ml-3 font-mono">atlas.market / nairobi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Smartphone className="h-3.5 w-3.5" /> M-Pesa connected
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-12">
          {/* Sidebar filters */}
          <aside className="border-b border-border p-5 lg:col-span-3 lg:border-b-0 lg:border-r">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search produce, compost…"
                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-ring"
              />
            </div>
            <div className="mt-5 text-xs uppercase tracking-wider text-muted-foreground">
              Category
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 lg:flex-col lg:gap-1">
              {filters.map((f, i) => (
                <button
                  key={f}
                  className={`rounded-lg px-3 py-1.5 text-left text-sm transition ${
                    i === 0
                      ? "bg-forest-deep text-bone"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-gradient-to-br from-gold/15 to-clay/10 p-4">
              <div className="text-xs uppercase tracking-wider text-clay">Live</div>
              <div className="mt-1 text-sm text-foreground">
                Avg. price · sukuma wiki
              </div>
              <div className="mt-1 font-display text-2xl text-foreground tabular-nums">
                KSh 38 <span className="text-xs font-normal text-moss">↓ 4%</span>
              </div>
            </div>
          </aside>

          {/* Listings */}
          <div className="p-5 lg:col-span-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {listings.map((l) => (
                <div
                  key={l.name}
                  className="group overflow-hidden rounded-xl border border-border bg-background transition hover:border-moss/40 hover:shadow-[var(--shadow-soft)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <img
                      src={produceImg}
                      alt={l.name}
                      loading="lazy"
                      width={600}
                      height={450}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <span className="absolute left-2 top-2 rounded-md bg-bone/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-forest-deep">
                      {l.tag}
                    </span>
                  </div>
                  <div className="p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium text-foreground">{l.name}</div>
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {l.farm}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display text-base text-foreground tabular-nums">
                          KSh {l.price}
                        </div>
                        <div className="text-[10px] text-muted-foreground">/ {l.unit}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{l.stock} available</span>
                      <button className="font-medium text-forest-deep hover:underline">
                        Add to box →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Logistics tracker */}
          <aside className="border-t border-border p-5 lg:col-span-3 lg:border-l lg:border-t-0">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Logistics · Live
            </div>
            <div className="mt-3 space-y-3">
              {[
                { route: "Kangemi → Westlands", driver: "Brian K.", status: "En route", pct: 62 },
                { route: "Kibera → Kilimani", driver: "Achieng' O.", status: "Picking up", pct: 22 },
                { route: "Nakuru → Naivasha", driver: "Peter M.", status: "Delivered", pct: 100 },
              ].map((r) => (
                <div key={r.route} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <Truck className="h-3.5 w-3.5 text-forest" /> {r.driver}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                        r.pct === 100
                          ? "bg-moss/15 text-forest"
                          : "bg-gold/15 text-clay"
                      }`}
                    >
                      {r.pct === 100 && <CheckCircle2 className="mr-0.5 inline h-3 w-3" />}
                      {r.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{r.route}</div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-forest to-moss transition-all duration-1000"
                      style={{ width: `${r.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </Section>
  );
}
