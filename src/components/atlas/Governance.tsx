import { Section, SectionHeader } from "./Section";
import { Vote, FileText, Landmark, CheckCircle2, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getProposals,
  voteOnProposal,
  createProposal,
  getMyVotes,
} from "@/lib/atlas-cloud.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { OnboardingGate } from "./OnboardingGate";

type Proposal = {
  id: string;
  title: string;
  body: string;
  status: string;
  quorum_pct: number;
  yes_count: number;
  no_count: number;
  zone_id: string | null;
};

function GovernanceInner() {
  const qc = useQueryClient();
  const proposalsFn = useServerFn(getProposals);
  const voteFn = useServerFn(voteOnProposal);
  const createFn = useServerFn(createProposal);
  const myVotesFn = useServerFn(getMyVotes);

  const [userId, setUserId] = useState<string | null>(null);
  const [draftOpen, setDraftOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", body: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setUserId(s?.user.id ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const proposalsQ = useQuery({
    queryKey: ["proposals"],
    queryFn: () => proposalsFn(),
  });
  const myVotesQ = useQuery({
    queryKey: ["my-votes", userId],
    queryFn: () => myVotesFn(),
    enabled: !!userId,
  });
  const myVotes = new Map((myVotesQ.data?.votes ?? []).map((v) => [v.proposal_id, v.vote]));

  // Realtime: refresh on proposal changes
  useEffect(() => {
    const ch = supabase
      .channel("proposals-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "proposals" }, () =>
        qc.invalidateQueries({ queryKey: ["proposals"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const vote = useMutation({
    mutationFn: (v: { proposal_id: string; vote: boolean }) => voteFn({ data: v }),
    onSuccess: () => {
      toast.success("Vote recorded");
      qc.invalidateQueries({ queryKey: ["proposals"] });
      qc.invalidateQueries({ queryKey: ["my-votes", userId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const create = useMutation({
    mutationFn: () =>
      createFn({ data: { title: draft.title.trim(), body: draft.body.trim(), quorum_pct: 60 } }),
    onSuccess: () => {
      toast.success("Proposal opened for voting");
      setDraft({ title: "", body: "" });
      setDraftOpen(false);
      qc.invalidateQueries({ queryKey: ["proposals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const proposals = (proposalsQ.data?.proposals ?? []) as Proposal[];
  const loading = proposalsQ.isLoading;

  return (
    <Section id="governance">
      <SectionHeader
        eyebrow="Governance & Ownership"
        title={<>Communities decide. <span className="text-gradient-forest">Atlas executes.</span></>}
        description="Local councils, SACCOs, and elected stewards vote on treasury allocations, partnerships, and rules. Transparent. Practical. Not crypto-hype."
      />

      <div className="mt-12 grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {loading ? "Loading proposals…" : `${proposals.length} active proposal${proposals.length === 1 ? "" : "s"}`}
            </div>
            {userId && (
              <Button size="sm" variant="forest" onClick={() => setDraftOpen((v) => !v)}>
                <Plus className="h-3.5 w-3.5" /> Open proposal
              </Button>
            )}
          </div>

          {draftOpen && (
            <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
              <input
                placeholder="Proposal title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                maxLength={140}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              />
              <textarea
                placeholder="What should the network decide?"
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                maxLength={1000}
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setDraftOpen(false)}>Cancel</Button>
                <Button
                  variant="forest"
                  size="sm"
                  disabled={draft.title.trim().length < 4 || draft.body.trim().length < 10 || create.isPending}
                  onClick={() => create.mutate()}
                >
                  {create.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Submit"}
                </Button>
              </div>
            </div>
          )}

          {loading && (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
              Loading proposals…
            </div>
          )}

          {!loading && proposals.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
              No proposals yet. Be the first to open one.
            </div>
          )}

          {proposals.map((p) => {
            const total = p.yes_count + p.no_count;
            const pct = total === 0 ? 0 : Math.round((p.yes_count / total) * 100);
            const passed = p.status === "passed";
            const myVote = myVotes.get(p.id);
            const hasVoted = myVote !== undefined;
            return (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-foreground">
                        {p.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 font-medium capitalize ${
                          passed ? "bg-moss/15 text-forest" : "bg-gold/15 text-clay"
                        }`}
                      >
                        {passed && <CheckCircle2 className="mr-1 inline h-3 w-3" />}
                        {p.status}
                      </span>
                      <span className="text-muted-foreground">Quorum {p.quorum_pct}%</span>
                      {p.zone_id && <span className="text-muted-foreground capitalize">· {p.zone_id}</span>}
                    </div>
                    <div className="mt-3 font-display text-lg text-foreground">{p.title}</div>
                    <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.body}</div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {!userId ? (
                      <span className="text-xs text-muted-foreground">Sign in to vote</span>
                    ) : hasVoted ? (
                      <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                        You voted {myVote ? "Yes" : "No"}
                      </span>
                    ) : passed || p.status !== "voting" ? (
                      <span className="text-xs text-muted-foreground">Closed</span>
                    ) : (
                      <>
                        <Button size="sm" variant="forest"
                          disabled={vote.isPending}
                          onClick={() => vote.mutate({ proposal_id: p.id, vote: true })}>
                          Yes
                        </Button>
                        <Button size="sm" variant="outline"
                          disabled={vote.isPending}
                          onClick={() => vote.mutate({ proposal_id: p.id, vote: false })}>
                          No
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                    <div className="bg-moss transition-all duration-500" style={{ width: `${pct}%` }} />
                    <div className="bg-clay/50 transition-all duration-500" style={{ width: `${100 - pct}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span><span className="font-medium text-forest">Yes</span> {p.yes_count.toLocaleString()}</span>
                    <span><span className="font-medium text-clay">No</span> {p.no_count.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4 lg:col-span-4">
          <div className="rounded-2xl border border-border bg-forest-deep p-6 text-bone">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gold-soft">
              <Landmark className="h-4 w-4" /> Treasury · Live
            </div>
            <div className="mt-4 font-display text-3xl tracking-tight">KSh 12.8M</div>
            <div className="mt-1 text-sm text-bone/70">Held across 14 local councils</div>
            <div className="mt-5 space-y-2 text-xs">
              {[
                ["Operations", 38],
                ["Infrastructure", 26],
                ["Community grants", 22],
                ["Reserve", 14],
              ].map(([k, v]) => (
                <div key={k as string} className="flex items-center gap-2">
                  <span className="w-32 text-bone/70">{k}</span>
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-gold" style={{ width: `${v}%` }} />
                  </div>
                  <span className="w-8 text-right text-bone/60">{v}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <FileText className="h-4 w-4" /> Audit Log · Live
            </div>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              {proposals.slice(0, 4).map((p) => (
                <li key={p.id}>
                  <span className="font-mono">{p.id.slice(0, 6).toUpperCase()}</span> · {p.status} ·{" "}
                  {p.yes_count + p.no_count} votes
                </li>
              ))}
              {proposals.length === 0 && <li>No on-chain activity yet.</li>}
            </ul>
          </div>

          <div className="rounded-2xl border border-gold/30 bg-gold/10 p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-clay">
              <Vote className="h-4 w-4" /> Your voice
            </div>
            <div className="mt-2 text-sm text-foreground">
              {userId
                ? `You've cast ${myVotesQ.data?.votes?.length ?? 0} vote(s) on Atlas governance.`
                : "Sign in to cast a vote as a verified member."}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

export function Governance() {
  return (
    <OnboardingGate
      id="governance"
      eyebrow="Governance & Ownership"
      title={<>Communities decide. <span className="text-gradient-forest">Atlas executes.</span></>}
      description="Local councils, SACCOs, and elected stewards vote on treasury allocations, partnerships, and rules."
    >
      <GovernanceInner />
    </OnboardingGate>
  );
}

