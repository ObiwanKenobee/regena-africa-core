import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImg from "@/assets/hero-nairobi.jpg";

export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImg}
          alt="Aerial view of regenerative Nairobi at golden hour with urban farms and solar infrastructure"
          width={1920}
          height={1280}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-deep/85 via-forest-deep/70 to-background" />
        <div className="absolute inset-0 ring-grid opacity-30 mix-blend-overlay" />
      </div>

      <div className="mx-auto max-w-7xl px-4">
        <div className="grid items-end gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="inline-flex items-center gap-2 rounded-full glass-dark px-3 py-1.5 text-xs text-gold-soft">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
              </span>
              Live across Nairobi · Nakuru · Kisumu
            </div>

            <h1 className="mt-6 max-w-4xl text-5xl font-medium leading-[1.02] tracking-tight text-bone md:text-7xl lg:text-[5.5rem]">
              Regenerating Africa
              <br />
              <span className="text-gradient-gold">from the bottom up.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-bone/80 md:text-xl">
              Atlas Sanctum is the regenerative economic operating system connecting farms,
              households, businesses, and communities into one trusted network — built for
              real African economies, not Silicon Valley.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button variant="gold" size="xl" className="group">
                Start Free
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Button>
              <Button variant="glass" size="xl">Join Community</Button>
              <Button variant="link" size="xl" className="text-bone/90 hover:text-gold-soft">
                Become a Partner
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs uppercase tracking-[0.18em] text-bone/50">
              <span>Built with SACCOs</span>
              <span className="hidden h-px w-8 bg-bone/20 md:block" />
              <span>M-Pesa Ready</span>
              <span className="hidden h-px w-8 bg-bone/20 md:block" />
              <span>Verified Carbon</span>
              <span className="hidden h-px w-8 bg-bone/20 md:block" />
              <span>Open Governance</span>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="glass-dark rounded-2xl p-5 text-bone shadow-[var(--shadow-elevated)]">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gold-soft">
                <Sparkles className="h-3.5 w-3.5" /> Today on Atlas
              </div>
              <div className="mt-4 space-y-3 text-sm">
                {[
                  ["Kibera Compost Co-op", "+412 kg processed", "↑ 18%"],
                  ["Nakuru Egg Collective", "2,840 trays shipped", "↑ 6%"],
                  ["Kisumu Riders", "147 deliveries", "↑ 23%"],
                ].map(([title, sub, delta], i) => (
                  <div
                    key={title}
                    className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5 animate-count-in"
                    style={{ animationDelay: `${i * 120}ms` }}
                  >
                    <div>
                      <div className="font-medium">{title}</div>
                      <div className="text-xs text-bone/60">{sub}</div>
                    </div>
                    <span className="rounded-md bg-gold/20 px-2 py-0.5 text-xs font-medium text-gold-soft">
                      {delta}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-white/10 pt-3 text-[11px] text-bone/50">
                Updated every 90s · Nairobi Operations Center
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
