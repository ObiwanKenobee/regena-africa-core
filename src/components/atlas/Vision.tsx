import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import visionImg from "@/assets/vision-future.jpg";

export function Vision() {
  return (
    <section id="vision" className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img
          src={visionImg}
          alt="Vision of a regenerative African city at dawn with green skyline, urban farms, clean river, vibrant markets"
          width={1920}
          height={1080}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-deep/70 via-forest-deep/60 to-ink/95" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-32 md:py-48 text-bone">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gold-soft">
            <span className="h-1 w-1 rounded-full bg-gold" /> The vision
          </div>
          <h2 className="mt-6 font-display text-5xl font-medium leading-[1.02] tracking-tight md:text-7xl lg:text-[5.5rem]">
            A regenerative Africa
            <br />
            <span className="text-gradient-gold">that works for everyone.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-bone/75 md:text-xl">
            Green skylines. Thriving markets. Clean rivers. Empowered youth and women.
            Local economies that compound dignity, not extraction. This is what we build —
            block by block, household by household, harvest by harvest.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button variant="gold" size="xl" className="group">
              Start Free
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Button>
            <Button variant="glass" size="xl">Talk to our team</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
