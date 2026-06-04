import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Vote, PiggyBank, ShoppingBag, Activity } from "lucide-react";
import { getZoneImpact } from "@/lib/atlas-cloud.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAtlas } from "@/lib/atlas-store";

/**
 * Aggregated impact counters by zone, fed by getZoneImpact (which joins
 * proposals, savings circles, contributions, and orders). Subscribes to
 * realtime changes on the contributing tables so counters tick live.
 */
export function ZoneImpactWidget() {
  const qc = useQueryClient();
  const fetchImpact = useServerFn(getZoneImpact);
  const { selectedZone, setSelectedZone } = useAtlas();

  const impactQ = useQuery({
    queryKey: ["zone-impact"],
    queryFn: () => fetchImpact(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const ch = supabase
      .channel("zone-impact-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "proposals" }, () =>
        qc.invalidateQueries({ queryKey: ["zone-impact"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "savings_circles" }, () =>
        qc.invalidateQueries({ queryKey: ["zone-impact"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "circle_contributions" }, () =>
        qc.invalidateQueries({ queryKey: ["zone-impact"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () =>
        qc.invalidateQueries({ queryKey: ["zone-impact"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const zones = impactQ.data?.zones ?? [];
  const totals = impactQ.data?.totals;
  const selected = zones.find((z) => z.id === selectedZone);
  const m = selected ?? {
    proposals: totals?.proposals ?? 0,
    votes: totals?.votes ?? 0,
    circle_balance: totals?.circle_balance ?? 0,
    order_value: totals?.order_value ?? 0,
  };

  const cards = [
    { icon: Vote, label: "Active proposals", value: m.proposals.toLocaleString(), sub: `${m.votes.toLocaleString()} votes cast` },
    { icon: PiggyBank, label: "SACCO balance", value: `KSh ${Number(m.circle_balance).toLocaleString()}`, sub: "Across local circles" },
    { icon: ShoppingBag, label: "Marketplace value", value: `KSh ${Number(m.order_value).toLocaleString()}`, sub: "Paid + in-transit orders" },
    { icon: Activity, label: "Network engagement", value: zones.length.toString(), sub: "Zones with activity" },
  ];

  return (
    <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Civic + economic impact
          </div>
          <div className="mt-1 font-display text-xl text-foreground">
            {selected ? selected.name : "All Kenya"} · live counters
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {impactQ.isFetching && (
            <span className="rounded-full bg-moss/10 px-2 py-0.5 text-forest">syncing…</span>
          )}
          {zones.length > 0 && (
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs"
            >
              <option value="all">All Kenya</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-deep/5 text-forest-deep">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 font-display text-2xl tabular-nums text-foreground">
                {impactQ.isLoading ? "…" : c.value}
              </div>
              <div className="text-sm font-medium text-foreground">{c.label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{c.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
