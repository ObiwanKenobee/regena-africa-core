import { Section, SectionHeader } from "./Section";
import communityImg from "@/assets/community-group.jpg";
import riderImg from "@/assets/portrait-rider.jpg";
import farmerImg from "@/assets/portrait-farmer.jpg";
import { Users2, Bike, HandCoins, School } from "lucide-react";

const nodes = [
  { label: "Mama Atieno", role: "Community Champion", x: 20, y: 30 },
  { label: "Westlands SACCO", role: "Savings group", x: 70, y: 22 },
  { label: "Brian, rider", role: "Last-mile", x: 50, y: 60 },
  { label: "Light Academy", role: "School partner", x: 28, y: 72 },
  { label: "Kilimani Parish", role: "Faith partner", x: 78, y: 70 },
  { label: "Kangemi Co-op", role: "Farm cluster", x: 38, y: 18 },
];

const edges = [
  [0, 2], [2, 3], [2, 4], [0, 5], [1, 4], [5, 0], [1, 2],
];

export function Community() {
  return (
    <Section id="community" dark className="bg-forest-deep">
      <SectionHeader
        light
        eyebrow="Community Network"
        title={<>The network is <span className="text-gradient-gold">human first.</span></>}
        description="Champions, SACCOs, women-led groups, riders, schools, and parishes form the trust fabric Atlas runs on. Software follows community — not the other way around."
      />

      <div className="mt-14 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-forest to-forest-deep">
            <div className="absolute inset-0 ring-grid opacity-30" />
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
              {edges.map(([a, b], i) => (
                <line
                  key={i}
                  x1={nodes[a].x}
                  y1={nodes[a].y}
                  x2={nodes[b].x}
                  y2={nodes[b].y}
                  stroke="oklch(0.78 0.13 85 / 0.5)"
                  strokeWidth="0.3"
                  strokeDasharray="0.8 0.6"
                />
              ))}
              {nodes.map((n) => (
                <g key={n.label}>
                  <circle cx={n.x} cy={n.y} r="3" fill="oklch(0.78 0.13 85 / 0.18)" />
                  <circle cx={n.x} cy={n.y} r="1.2" fill="oklch(0.78 0.13 85)" />
                </g>
              ))}
            </svg>

            {nodes.map((n) => (
              <div
                key={n.label}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${n.x}%`, top: `${n.y}%` }}
              >
                <div className="mt-4 whitespace-nowrap rounded-md glass-dark px-2 py-1 text-[10px] text-bone">
                  <div className="font-medium">{n.label}</div>
                  <div className="text-bone/60">{n.role}</div>
                </div>
              </div>
            ))}

            <div className="absolute bottom-4 left-4 rounded-lg glass-dark px-3 py-2 text-[11px] text-bone/80">
              Trust graph · Westlands cluster · 1,284 nodes
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-5">
          {[
            { icon: Users2, title: "Community Champions", body: "Trusted neighbors who onboard households, resolve disputes, and earn from coordination.", img: communityImg },
            { icon: Bike, title: "Youth Delivery Riders", body: "Local riders run last-mile food and waste loops, paid weekly via M-Pesa.", img: riderImg },
            { icon: HandCoins, title: "SACCO Integration", body: "Savings groups, table banking, and credit unions plug into Atlas wallets directly.", img: null },
            { icon: School, title: "Schools & Faith Networks", body: "Schools and parishes act as collection nodes, learning hubs, and trust anchors.", img: null },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="group flex items-start gap-4 rounded-2xl glass-dark p-4 transition hover:bg-white/[0.07]"
              >
                {c.img ? (
                  <img
                    src={c.img}
                    alt={c.title}
                    loading="lazy"
                    width={64}
                    height={64}
                    className="h-16 w-16 flex-none rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 flex-none items-center justify-center rounded-xl bg-gold/15 text-gold">
                    <Icon className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 text-bone">
                    <Icon className="h-4 w-4 text-gold-soft" />
                    <span className="font-medium">{c.title}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-bone/70">{c.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <img src={farmerImg} alt="" className="hidden" loading="lazy" />
      </div>
    </Section>
  );
}
