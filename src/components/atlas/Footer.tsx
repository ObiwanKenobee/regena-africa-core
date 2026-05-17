import { AtlasMark } from "./AtlasMark";

const groups = [
  { title: "Platform", items: ["Marketplace", "Wallet", "Farm OS", "Governance", "AI Engine"] },
  { title: "Communities", items: ["Households", "Farmers", "Riders", "SACCOs", "SMEs"] },
  { title: "Company", items: ["About", "Impact reports", "Press", "Careers", "Contact"] },
  { title: "Resources", items: ["Docs", "Status", "Partners", "Research", "Privacy"] },
];

export function Footer() {
  return (
    <footer className="bg-ink text-bone">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2.5">
              <AtlasMark className="h-9 w-9" />
              <div>
                <div className="font-display text-lg">Atlas Sanctum</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-gold-soft/80">
                  Regenerative OS
                </div>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-bone/60">
              Building the operational backbone for a regenerative Africa. From Nairobi
              to Nakuru, Kisumu, and beyond — one household at a time.
            </p>
            <div className="mt-6 flex items-center gap-3 text-xs text-bone/50">
              <span>Nairobi · Kenya</span>
              <span>·</span>
              <span>hello@atlassanctum.africa</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 lg:col-span-8 lg:grid-cols-4">
            {groups.map((g) => (
              <div key={g.title}>
                <div className="text-xs uppercase tracking-wider text-gold-soft">{g.title}</div>
                <ul className="mt-3 space-y-2 text-sm text-bone/70">
                  {g.items.map((i) => (
                    <li key={i} className="cursor-pointer transition hover:text-bone">{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-bone/40">
          <div>© {new Date().getFullYear()} Atlas Sanctum Cooperative · Built in Kenya</div>
          <div className="flex gap-4">
            <span>Terms</span>
            <span>Privacy</span>
            <span>Open governance charter</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
