import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Wifi, WifiOff, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AtlasMark } from "./AtlasMark";
import { useAtlas } from "@/lib/atlas-store";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/lib/admin.functions";

const links = [
  { href: "#impact", label: "Impact" },
  { href: "#marketplace", label: "Marketplace" },
  { href: "#farms", label: "Farms" },
  { href: "#waste", label: "Circular" },
  { href: "#finance", label: "Finance" },
  { href: "#governance", label: "Governance" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { role, lowBandwidth, setLowBandwidth } = useAtlas();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "py-2" : "py-4"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4">
        <div
          className={`flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-500 ${
            scrolled ? "glass-dark shadow-[var(--shadow-elevated)]" : ""
          }`}
        >
          <a href="#top" className="flex items-center gap-2.5 text-bone">
            <AtlasMark className="h-8 w-8" />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">Atlas Sanctum</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-gold-soft/80">
                Regenerative OS
              </div>
            </div>
          </a>

          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm text-bone/80 transition hover:bg-white/5 hover:text-bone"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={() => setLowBandwidth(!lowBandwidth)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-bone/80 hover:bg-white/10"
              aria-pressed={lowBandwidth}
              title="Low bandwidth mode"
            >
              {lowBandwidth ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
              <span className="hidden xl:inline">{lowBandwidth ? "2G mode" : "Full"}</span>
            </button>
            {role ? (
              <Link to="/dashboard">
                <Button variant="ghost" className="text-bone hover:bg-white/10 hover:text-bone">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/onboarding">
                <Button variant="ghost" className="text-bone hover:bg-white/10 hover:text-bone">
                  Sign in
                </Button>
              </Link>
            )}
            <Link to="/onboarding">
              <Button variant="gold">{role ? "Switch role" : "Start Free"}</Button>
            </Link>
          </div>

          <button
            className="rounded-lg p-2 text-bone lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="mt-2 rounded-2xl glass-dark p-4 lg:hidden">
            <div className="flex flex-col gap-1">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-bone/90 hover:bg-white/5"
                >
                  {l.label}
                </a>
              ))}
              <div className="mt-2 flex gap-2">
                <Link to={role ? "/dashboard" : "/onboarding"} className="flex-1">
                  <Button variant="ghost" className="w-full text-bone hover:bg-white/10">
                    {role ? "Dashboard" : "Sign in"}
                  </Button>
                </Link>
                <Link to="/onboarding" className="flex-1">
                  <Button variant="gold" className="w-full">
                    {role ? "Switch role" : "Start Free"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
