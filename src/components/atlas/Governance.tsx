import { Section, SectionHeader } from "./Section";
import { Vote, FileText, Landmark, CheckCircle2 } from "lucide-react";

const proposals = [
  {
    id: "WL-024",
    title: "Fund 3 new compost hubs in Mathare",
    body: "Allocate KSh 1.8M from Q3 treasury to build sorting + briquette capacity.",
    yes: 412,
    no: 38,
    quorum: 60,
    status: "Voting",
  },
  {
    id: "NK-011",
    title: "Increase rider weekly minimum to KSh 4,800",
    body: "Adjust last-mile compensation across Nakuru and Naivasha clusters.",
    yes: 286,
    no: 92,
    quorum: 72,
    status: "Voting",
  },
  {
    id: "KS-007",
    title: "Partner with 4 Kisumu schools as collection nodes",
    body: "12-month pilot · revenue share with PTA-managed accounts.",
    yes: 198,
    no: 14,
    quorum: 100,
    status: "Passed",
  },
];

export function Governance() {
  return (
    <Section id="governance">
      <SectionHeader
        eyebrow="Governance & Ownership"
        title={<>Communities decide. <span className="text-gradient-forest">Atlas executes.</span></>}
        description="Local councils, SACCOs, and elected stewards vote on treasury allocations, partnerships, and rules. Transparent. Practical. Not crypto-hype."
      />

      <div className="mt-12 grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          {proposals.map((p) => {
            const total = p.yes + p.no;
            const pct = Math.round((p.yes / total) * 100);
            const passed = p.status === "Passed";
            return (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-foreground">
                        {p.id}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 font-medium ${
                          passed
                            ? "bg-moss/15 text-forest"
                            : "bg-gold/15 text-clay"
                        }`}
                      >
                        {passed && <CheckCircle2 className="mr-1 inline h-3 w-3" />}
                        {p.status}
                      </span>
                      <span className="text-muted-foreground">Quorum {p.quorum}%</span>
                    </div>
                    <div className="mt-3 font-display text-lg text-foreground">{p.title}</div>
                    <div className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {p.body}
                    </div>
                  </div>
                  <button className="rounded-lg bg-forest-deep px-3 py-1.5 text-xs font-medium text-bone transition hover:bg-forest">
                    {passed ? "View result" : "Cast vote"}
                  </button>
                </div>

                <div className="mt-5">
                  <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                    <div className="bg-moss" style={{ width: `${pct}%` }} />
                    <div className="bg-clay/50" style={{ width: `${100 - pct}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>
                      <span className="font-medium text-forest">Yes</span> {p.yes}
                    </span>
                    <span>
                      <span className="font-medium text-clay">No</span> {p.no}
                    </span>
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
            <div className="mt-4 font-display text-3xl tracking-tight">
              KSh 12.8M
            </div>
            <div className="mt-1 text-sm text-bone/70">
              Held across 14 local councils
            </div>
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
              <FileText className="h-4 w-4" /> Audit Log · Today
            </div>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li>14:02 · Treasury disbursement · KS-007 · KSh 240k</li>
              <li>11:48 · New council member elected · Westlands</li>
              <li>09:12 · 3 SACCOs onboarded to wallet v2</li>
              <li>08:30 · Carbon batch #1284 verified</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-gold/30 bg-gold/10 p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-clay">
              <Vote className="h-4 w-4" /> Your voice
            </div>
            <div className="mt-2 text-sm text-foreground">
              You hold <span className="font-medium">2 vote-weights</span> as a verified household in Westlands.
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
