import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Section({
  id,
  className,
  children,
  dark,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative py-20 md:py-28",
        dark && "bg-forest-deep text-bone",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4">{children}</div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  light,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  light?: boolean;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center"
      )}
    >
      {eyebrow && (
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]",
            light
              ? "border border-gold/30 bg-white/5 text-gold-soft"
              : "border border-moss/30 bg-moss/10 text-forest"
          )}
        >
          <span className="h-1 w-1 rounded-full bg-current" />
          {eyebrow}
        </div>
      )}
      <h2
        className={cn(
          "mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl lg:text-6xl",
          light ? "text-bone" : "text-foreground"
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-5 text-lg leading-relaxed md:text-xl",
            light ? "text-bone/70" : "text-muted-foreground"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
