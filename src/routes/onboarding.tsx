import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Home, Sprout, Store, Bike, ArrowRight, Check, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAtlas, type Role } from "@/lib/atlas-store";
import { AtlasMark } from "@/components/atlas/AtlasMark";
import { supabase } from "@/integrations/supabase/client";
import { upsertProfileRole } from "@/lib/atlas-cloud.functions";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Join Atlas Sanctum — Choose your role" },
      {
        name: "description",
        content:
          "Onboard as a household, farmer, SME, or rider. Get a dashboard tailored to how you participate in the regenerative network.",
      },
    ],
  }),
  component: OnboardingPage,
});

const ROLES: {
  id: Role;
  title: string;
  icon: typeof Home;
  tagline: string;
  perks: string[];
  cta: string;
}[] = [
  {
    id: "household",
    title: "Household",
    icon: Home,
    tagline: "Eat local, recycle, earn regen credits.",
    perks: ["Weekly food box delivery", "Compost pickup & credits", "Family nutrition score"],
    cta: "I cook for a family",
  },
  {
    id: "farmer",
    title: "Farmer or Co-op",
    icon: Sprout,
    tagline: "Sell direct. Get paid same-day in shillings.",
    perks: ["Live demand & pricing", "Crop & IoT monitoring", "M-Pesa same-day payout"],
    cta: "I grow food",
  },
  {
    id: "sme",
    title: "SME or SACCO",
    icon: Store,
    tagline: "Procure, finance, and serve your community.",
    perks: ["Bulk procurement contracts", "Working capital pricing", "SACCO table-banking ledger"],
    cta: "I run a business",
  },
  {
    id: "rider",
    title: "Rider",
    icon: Bike,
    tagline: "One screen: pickup, drop, paid.",
    perks: ["Stacked routes by zone", "Daily M-Pesa settlement", "Insurance & bonuses"],
    cta: "I deliver",
  },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const { role, setRole } = useAtlas();
  const upsertFn = useServerFn(upsertProfileRole);
  const [selected, setSelected] = useState<Role | null>(role);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [zone, setZone] = useState("Nairobi");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
  }, []);

  const save = useMutation({
    mutationFn: () =>
      upsertFn({
        data: {
          preferred_role: selected!,
          full_name: name.trim() || undefined,
          phone: phone.trim() || undefined,
        },
      }),
  });

  const finish = async () => {
    if (!selected) return;
    setRole(selected);
    if (userId) {
      try {
        await save.mutateAsync();
        toast.success("Profile saved");
      } catch (e: any) {
        toast.error(e?.message ?? "Could not save profile");
      }
    }
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-forest-deep to-background pb-20 pt-10 text-bone">
      <div className="mx-auto max-w-5xl px-4">
        <Link to="/" className="inline-flex items-center gap-2 text-bone/90">
          <AtlasMark className="h-7 w-7" />
          <span className="font-display text-sm">Atlas Sanctum</span>
        </Link>

        <div className="mt-10 flex items-center gap-3 text-xs uppercase tracking-wider text-gold-soft/90">
          <span>Step {step + 1} of 2</span>
          <div className="h-px flex-1 bg-bone/15" />
          <span>Onboarding</span>
        </div>

        {step === 0 && (
          <div className="mt-6">
            <h1 className="font-display text-4xl tracking-tight md:text-5xl">
              How will you join the network?
            </h1>
            <p className="mt-3 max-w-xl text-bone/70">
              Your role shapes your dashboard, your payments, and the people you'll meet on Atlas.
              You can change this later.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const active = selected === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelected(r.id)}
                    className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition ${
                      active
                        ? "border-gold bg-bone text-ink shadow-[var(--shadow-glow)]"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          active ? "bg-forest-deep text-bone" : "bg-white/10 text-gold-soft"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {active && (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-forest-deep text-bone">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                    <div className="mt-5 font-display text-xl">{r.title}</div>
                    <div className={`mt-1 text-sm ${active ? "text-ink/70" : "text-bone/70"}`}>
                      {r.tagline}
                    </div>
                    <ul className={`mt-4 space-y-1.5 text-xs ${active ? "text-ink/80" : "text-bone/60"}`}>
                      {r.perks.map((p) => (
                        <li key={p} className="flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-current" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                variant="gold"
                size="lg"
                disabled={!selected}
                onClick={() => setStep(1)}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 1 && selected && (
          <div className="mt-6 max-w-xl">
            <h1 className="font-display text-3xl tracking-tight md:text-4xl">Tell us about you</h1>
            <p className="mt-3 text-bone/70">
              We use this to wire your dashboard to the right zone and SACCO partners.
            </p>

            <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <Field label="Name or business">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Achieng' Otieno"
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-bone outline-none focus:border-gold"
                />
              </Field>
              <Field label="M-Pesa phone">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07••• ••• •••"
                  inputMode="tel"
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-bone outline-none focus:border-gold"
                />
              </Field>
              <Field label="Zone">
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-bone outline-none focus:border-gold"
                >
                  {["Nairobi", "Kiambu", "Nakuru", "Kisumu", "Eldoret", "Mombasa", "Nyeri"].map(
                    (z) => (
                      <option key={z} value={z} className="text-ink">
                        {z}
                      </option>
                    ),
                  )}
                </select>
              </Field>
            </div>

            <div className="mt-8 flex justify-between">
              <Button variant="ghost" className="text-bone hover:bg-white/10" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button variant="gold" size="lg" onClick={finish}>
                Open my dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-wider text-gold-soft/80">{label}</span>
      {children}
    </label>
  );
}
