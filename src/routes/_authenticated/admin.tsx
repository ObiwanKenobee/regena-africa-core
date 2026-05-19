import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  adminListOrders,
  adminSetOrderStatus,
  adminUpsertZone,
  adminUpsertListing,
  adminDeleteListing,
  checkIsAdmin,
} from "@/lib/admin.functions";
import { getZones, getListings } from "@/lib/atlas-cloud.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AtlasMark } from "@/components/atlas/AtlasMark";
import { ShieldCheck, Trash2, Plus, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Atlas Sanctum" }] }),
  component: AdminPage,
});

const STATUS_OPTIONS = [
  "stk_sent","paid","preparing","picked","in_transit","delivered","failed","cancelled",
] as const;

function AdminPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const checkAdmin = useServerFn(checkIsAdmin);
  const listOrdersFn = useServerFn(adminListOrders);
  const setStatusFn = useServerFn(adminSetOrderStatus);
  const upsertZoneFn = useServerFn(adminUpsertZone);
  const upsertListingFn = useServerFn(adminUpsertListing);
  const deleteListingFn = useServerFn(adminDeleteListing);
  const getZonesFn = useServerFn(getZones);
  const getListingsFn = useServerFn(getListings);

  const adminQ = useQuery({ queryKey: ["isAdmin"], queryFn: () => checkAdmin() });
  const ordersQ = useQuery({
    queryKey: ["adminOrders"],
    queryFn: () => listOrdersFn(),
    enabled: !!adminQ.data?.isAdmin,
    refetchInterval: 5000,
  });
  const zonesQ = useQuery({ queryKey: ["zones"], queryFn: () => getZonesFn() });
  const listingsQ = useQuery({ queryKey: ["adminListings"], queryFn: () => getListingsFn() });

  // Realtime refresh
  useEffect(() => {
    const ch = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () =>
        qc.invalidateQueries({ queryKey: ["adminOrders"] })
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "zones" }, () =>
        qc.invalidateQueries({ queryKey: ["zones"] })
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, () =>
        qc.invalidateQueries({ queryKey: ["adminListings"] })
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const setStatus = useMutation({
    mutationFn: (v: { order_id: string; status: typeof STATUS_OPTIONS[number] }) => setStatusFn({ data: v }),
    onSuccess: () => toast.success("Order updated"),
    onError: (e: Error) => toast.error(e.message),
  });

  if (adminQ.isLoading) return <div className="p-10 text-sm text-muted-foreground">Checking access…</div>;
  if (!adminQ.data?.isAdmin) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-clay" />
          <h1 className="mt-4 font-display text-2xl">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account doesn't have the admin role. The first user to register is automatically an admin.
          </p>
          <Link to="/"><Button variant="outline" className="mt-6">Back home</Button></Link>
        </div>
      </div>
    );
  }

  const logout = async () => {
    await supabase.auth.signOut();
    qc.clear();
    nav({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <AtlasMark className="h-7 w-7" />
            <span className="font-display text-sm">Atlas · Admin</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={logout}><LogOut className="h-4 w-4" /> Sign out</Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        {/* Orders */}
        <section>
          <h2 className="font-display text-xl">Orders</h2>
          <p className="text-sm text-muted-foreground">Live order pipeline. Transition state manually.</p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Order</th>
                  <th className="px-3 py-2 text-left">Phone</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">M-Pesa</th>
                  <th className="px-3 py-2 text-left">Rider</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {(ordersQ.data?.orders ?? []).map((o: any) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-[11px]">{o.id.slice(0, 8)}</td>
                    <td className="px-3 py-2">{o.phone}</td>
                    <td className="px-3 py-2 text-right tabular-nums">KSh {Number(o.total).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-md bg-gold/15 px-2 py-0.5 text-[11px] text-clay">{o.status}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                      {o.mpesa_receipt ?? o.mpesa_checkout_id?.slice(0, 10) ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{o.rider ?? "—"}</td>
                    <td className="px-3 py-2 text-right">
                      <select
                        value={o.status}
                        onChange={(e) => setStatus.mutate({ order_id: o.id, status: e.target.value as any })}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {!ordersQ.data?.orders?.length && (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Zones */}
        <section>
          <h2 className="font-display text-xl">Regenerative zones</h2>
          <p className="text-sm text-muted-foreground">Edit live metrics. Updates broadcast to the dashboard.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(zonesQ.data?.zones ?? []).map((z: any) => (
              <ZoneCard key={z.id} zone={z} save={(v) => upsertZoneFn({ data: v }).then(() => toast.success(`${v.name} saved`))} />
            ))}
          </div>
        </section>

        {/* Listings */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Marketplace listings</h2>
            <Button
              size="sm"
              variant="forest"
              onClick={() =>
                upsertListingFn({ data: { farm: "New Farm", name: "New product", price: 100, unit: "kg", active: true } })
                  .then(() => toast.success("Listing created"))
              }
            ><Plus className="h-3.5 w-3.5" /> Add listing</Button>
          </div>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-3 py-2 text-left">Farm</th><th className="px-3 py-2 text-left">Product</th><th className="px-3 py-2 text-right">Price</th><th className="px-3 py-2 text-left">Unit</th><th className="px-3 py-2 text-left">Active</th><th className="px-3 py-2"></th></tr>
              </thead>
              <tbody>
                {(listingsQ.data?.listings ?? []).map((l: any) => (
                  <ListingRow key={l.id} listing={l}
                    save={(v) => upsertListingFn({ data: { ...v, id: l.id } }).then(() => toast.success("Saved"))}
                    remove={() => deleteListingFn({ data: { id: l.id } }).then(() => toast.success("Deleted"))} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function ZoneCard({ zone, save }: { zone: any; save: (v: any) => void }) {
  const [z, setZ] = useState(zone);
  useEffect(() => setZ(zone), [zone]);
  const num = (k: string) => (e: any) => setZ({ ...z, [k]: Number(e.target.value) });
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <input value={z.name} onChange={(e) => setZ({ ...z, name: e.target.value })}
          className="w-full bg-transparent font-display text-base outline-none" />
        <select value={z.status} onChange={(e) => setZ({ ...z, status: e.target.value })}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs">
          <option value="online">online</option><option value="scaling">scaling</option><option value="pilot">pilot</option>
        </select>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        {[
          ["households", "Households"], ["deliveries", "Deliveries"], ["jobs", "Jobs"],
          ["waste", "Waste (t)"], ["co2", "CO₂ (t)"], ["revenue", "Revenue (KSh)"],
        ].map(([k, label]) => (
          <label key={k} className="flex flex-col gap-0.5">
            <span className="text-muted-foreground">{label}</span>
            <input type="number" value={z[k]} onChange={num(k)} className="rounded border border-border bg-background px-2 py-1 tabular-nums" />
          </label>
        ))}
      </div>
      <Button variant="forest" size="sm" className="mt-3 w-full" onClick={() => save(z)}>Save zone</Button>
    </div>
  );
}

function ListingRow({ listing, save, remove }: { listing: any; save: (v: any) => void; remove: () => void }) {
  const [l, setL] = useState(listing);
  useEffect(() => setL(listing), [listing]);
  return (
    <tr className="border-t border-border">
      <td className="px-3 py-2"><input value={l.farm} onChange={(e) => setL({ ...l, farm: e.target.value })} className="w-full bg-transparent outline-none" /></td>
      <td className="px-3 py-2"><input value={l.name} onChange={(e) => setL({ ...l, name: e.target.value })} className="w-full bg-transparent outline-none" /></td>
      <td className="px-3 py-2 text-right"><input type="number" value={l.price} onChange={(e) => setL({ ...l, price: Number(e.target.value) })} className="w-24 rounded border border-border bg-background px-2 py-1 text-right tabular-nums" /></td>
      <td className="px-3 py-2"><input value={l.unit} onChange={(e) => setL({ ...l, unit: e.target.value })} className="w-16 bg-transparent outline-none" /></td>
      <td className="px-3 py-2"><input type="checkbox" checked={l.active} onChange={(e) => setL({ ...l, active: e.target.checked })} /></td>
      <td className="px-3 py-2 text-right">
        <Button variant="ghost" size="sm" onClick={() => save({ farm: l.farm, name: l.name, price: l.price, unit: l.unit, active: l.active })}>Save</Button>
        <Button variant="ghost" size="sm" onClick={remove}><Trash2 className="h-3.5 w-3.5" /></Button>
      </td>
    </tr>
  );
}
