import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  checkIsAdmin,
  adminListProfiles,
  adminTopUpUser,
  adminAddContribution,
  adminCreateCircle,
  adminSetProposalStatus,
  adminListProposals,
  adminListAuditLog,
} from "@/lib/admin.functions";
import { getSavingsCircles } from "@/lib/atlas-cloud.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AtlasMark } from "@/components/atlas/AtlasMark";
import { ShieldCheck, Wallet, PiggyBank, Vote, ScrollText, LogOut, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin-economy")({
  head: () => ({ meta: [{ title: "Admin · Economy — Atlas Sanctum" }] }),
  component: AdminEconomyPage,
});

function AdminEconomyPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const checkAdmin = useServerFn(checkIsAdmin);
  const listProfilesFn = useServerFn(adminListProfiles);
  const listCirclesFn = useServerFn(getSavingsCircles);
  const listProposalsFn = useServerFn(adminListProposals);
  const auditFn = useServerFn(adminListAuditLog);
  const topUpFn = useServerFn(adminTopUpUser);
  const contribFn = useServerFn(adminAddContribution);
  const createCircleFn = useServerFn(adminCreateCircle);
  const setProposalStatusFn = useServerFn(adminSetProposalStatus);

  const adminQ = useQuery({ queryKey: ["isAdmin"], queryFn: () => checkAdmin() });
  const profilesQ = useQuery({
    queryKey: ["adminProfiles"],
    queryFn: () => listProfilesFn(),
    enabled: !!adminQ.data?.isAdmin,
  });
  const circlesQ = useQuery({ queryKey: ["circles"], queryFn: () => listCirclesFn() });
  const proposalsQ = useQuery({
    queryKey: ["adminProposals"],
    queryFn: () => listProposalsFn(),
    enabled: !!adminQ.data?.isAdmin,
  });
  const auditQ = useQuery({
    queryKey: ["adminAudit"],
    queryFn: () => auditFn(),
    enabled: !!adminQ.data?.isAdmin,
    refetchInterval: 8_000,
  });

  // Realtime: refresh audit + dependent tables
  useEffect(() => {
    const ch = supabase
      .channel("admin-economy")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_actions" }, () =>
        qc.invalidateQueries({ queryKey: ["adminAudit"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "proposals" }, () =>
        qc.invalidateQueries({ queryKey: ["adminProposals"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "savings_circles" }, () =>
        qc.invalidateQueries({ queryKey: ["circles"] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const topUp = useMutation({
    mutationFn: (v: { user_id: string; amount: number; memo?: string }) => topUpFn({ data: v }),
    onSuccess: () => { toast.success("Wallet credited"); qc.invalidateQueries({ queryKey: ["adminAudit"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const contribute = useMutation({
    mutationFn: (v: { user_id: string; circle_id: string; amount: number }) => contribFn({ data: v }),
    onSuccess: () => { toast.success("Contribution recorded"); qc.invalidateQueries({ queryKey: ["adminAudit"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const createCircle = useMutation({
    mutationFn: (v: { name: string; contribution_amount: number; contribution_period: "weekly" | "monthly"; target: number }) =>
      createCircleFn({ data: v }),
    onSuccess: () => { toast.success("Circle created"); qc.invalidateQueries({ queryKey: ["circles"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const proposalStatus = useMutation({
    mutationFn: (v: { proposal_id: string; status: "voting" | "passed" | "rejected" | "executed" }) =>
      setProposalStatusFn({ data: v }),
    onSuccess: () => toast.success("Proposal updated"),
    onError: (e: Error) => toast.error(e.message),
  });

  if (adminQ.isLoading) return <div className="p-10 text-sm text-muted-foreground">Checking access…</div>;
  if (!adminQ.data?.isAdmin) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-clay" />
          <h1 className="mt-4 font-display text-2xl">Admin access required</h1>
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

  const profiles = profilesQ.data?.profiles ?? [];
  const circles = circlesQ.data?.circles ?? [];
  const proposals = proposalsQ.data?.proposals ?? [];
  const entries = auditQ.data?.entries ?? [];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <AtlasMark className="h-7 w-7" />
              <span className="font-display text-sm">Atlas · Admin Economy</span>
            </Link>
            <Link to="/admin" className="text-xs text-muted-foreground hover:text-foreground">
              ← Ops & marketplace
            </Link>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Wallet top-ups */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Wallet className="h-4 w-4" /> Wallet top-up
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Credit a member's wallet (e.g. settlement, grant, or refund).
            </p>
            <TopUpForm
              profiles={profiles}
              onSubmit={(v) => topUp.mutate(v)}
              pending={topUp.isPending}
            />
          </section>

          {/* Circle contribution */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <PiggyBank className="h-4 w-4" /> SACCO contribution
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Log a contribution on a member's behalf (cash collection).
            </p>
            <ContributeForm
              profiles={profiles}
              circles={circles}
              onSubmit={(v) => contribute.mutate(v)}
              pending={contribute.isPending}
            />
          </section>

          {/* Create circle */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Plus className="h-4 w-4" /> New savings circle
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Spin up a SACCO-style circle members can contribute to.
            </p>
            <CreateCircleForm onSubmit={(v) => createCircle.mutate(v)} pending={createCircle.isPending} />
          </section>
        </div>

        {/* Proposals */}
        <section>
          <h2 className="flex items-center gap-2 font-display text-xl">
            <Vote className="h-5 w-5" /> Proposals
          </h2>
          <p className="text-sm text-muted-foreground">Move proposals through their lifecycle.</p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Title</th>
                  <th className="px-3 py-2 text-left">Zone</th>
                  <th className="px-3 py-2 text-right">Yes / No</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p: any) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <div className="font-medium text-foreground">{p.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{p.body}</div>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{p.zone_id ?? "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      <span className="text-forest">{p.yes_count}</span> / <span className="text-clay">{p.no_count}</span>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={p.status}
                        onChange={(e) => proposalStatus.mutate({ proposal_id: p.id, status: e.target.value as any })}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                      >
                        {["voting", "passed", "rejected", "executed"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {!proposals.length && (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">No proposals yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Audit log */}
        <section>
          <h2 className="flex items-center gap-2 font-display text-xl">
            <ScrollText className="h-5 w-5" /> Audit log
          </h2>
          <p className="text-sm text-muted-foreground">Every economy action is captured here.</p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">When</th>
                  <th className="px-3 py-2 text-left">Action</th>
                  <th className="px-3 py-2 text-left">Target</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-left">Memo</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e: any) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">
                      {new Date(e.created_at).toLocaleString("en-KE", { hour12: false })}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px]">{e.action}</td>
                    <td className="px-3 py-2 text-xs">
                      {e.target_user_id ? <div className="font-mono">user:{e.target_user_id.slice(0, 8)}</div> : null}
                      {e.target_id ? <div className="font-mono text-muted-foreground">id:{e.target_id.toString().slice(0, 12)}</div> : null}
                      {!e.target_user_id && !e.target_id && "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {e.amount != null ? `KSh ${Number(e.amount).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{e.memo ?? "—"}</td>
                  </tr>
                ))}
                {!entries.length && (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">No entries yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function ProfileSelect({ profiles, value, onChange }: { profiles: any[]; value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
    >
      <option value="">Select member…</option>
      {profiles.map((p) => (
        <option key={p.id} value={p.id}>
          {p.full_name ?? p.id.slice(0, 8)} {p.phone ? `· ${p.phone}` : ""}
        </option>
      ))}
    </select>
  );
}

function TopUpForm({ profiles, onSubmit, pending }: {
  profiles: any[];
  onSubmit: (v: { user_id: string; amount: number; memo?: string }) => void;
  pending: boolean;
}) {
  const [user_id, setU] = useState("");
  const [amount, setAmount] = useState(500);
  const [memo, setMemo] = useState("");
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (!user_id || amount <= 0) return; onSubmit({ user_id, amount, memo: memo || undefined }); }}
      className="mt-3 space-y-2"
    >
      <ProfileSelect profiles={profiles} value={user_id} onChange={setU} />
      <input
        type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))}
        className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm tabular-nums"
      />
      <input
        value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Memo (optional)"
        className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
      />
      <Button type="submit" size="sm" variant="forest" disabled={pending || !user_id} className="w-full">
        Credit wallet
      </Button>
    </form>
  );
}

function ContributeForm({ profiles, circles, onSubmit, pending }: {
  profiles: any[]; circles: any[];
  onSubmit: (v: { user_id: string; circle_id: string; amount: number }) => void;
  pending: boolean;
}) {
  const [user_id, setU] = useState("");
  const [circle_id, setC] = useState("");
  const [amount, setAmount] = useState(500);
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (!user_id || !circle_id || amount <= 0) return; onSubmit({ user_id, circle_id, amount }); }}
      className="mt-3 space-y-2"
    >
      <ProfileSelect profiles={profiles} value={user_id} onChange={setU} />
      <select
        value={circle_id} onChange={(e) => setC(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
      >
        <option value="">Select circle…</option>
        {circles.map((c: any) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <input
        type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))}
        className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm tabular-nums"
      />
      <Button type="submit" size="sm" variant="forest" disabled={pending || !user_id || !circle_id} className="w-full">
        Record contribution
      </Button>
    </form>
  );
}

function CreateCircleForm({ onSubmit, pending }: {
  onSubmit: (v: { name: string; contribution_amount: number; contribution_period: "weekly" | "monthly"; target: number }) => void;
  pending: boolean;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(500);
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [target, setTarget] = useState(50000);
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (name.length < 2) return; onSubmit({ name, contribution_amount: amount, contribution_period: period, target }); setName(""); }}
      className="mt-3 space-y-2"
    >
      <input
        value={name} onChange={(e) => setName(e.target.value)} placeholder="Circle name"
        className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))}
          className="rounded-md border border-border bg-background px-2 py-2 text-sm tabular-nums" placeholder="Contribution"
        />
        <select
          value={period} onChange={(e) => setPeriod(e.target.value as "weekly" | "monthly")}
          className="rounded-md border border-border bg-background px-2 py-2 text-sm"
        >
          <option value="weekly">weekly</option>
          <option value="monthly">monthly</option>
        </select>
      </div>
      <input
        type="number" min={0} value={target} onChange={(e) => setTarget(Number(e.target.value))}
        className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm tabular-nums" placeholder="Target"
      />
      <Button type="submit" size="sm" variant="forest" disabled={pending} className="w-full">
        Create circle
      </Button>
    </form>
  );
}
