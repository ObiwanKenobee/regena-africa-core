import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getOnboardingStatus } from "@/lib/atlas-cloud.functions";
import { Section, SectionHeader } from "./Section";

type Props = {
  children: ReactNode;
  /** Section id forwarded to the locked placeholder so anchor links still land here. */
  id?: string;
  eyebrow: string;
  title: ReactNode;
  description: string;
};

/**
 * Gates Finance/Governance behind a completed profile. We require both a
 * full_name and a phone number — without a phone we can't actually wire
 * M-Pesa top-ups or SACCO notifications, so it's a hard prerequisite.
 */
export function OnboardingGate({ children, id, eyebrow, title, description }: Props) {
  const statusFn = useServerFn(getOnboardingStatus);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setUserId(s?.user.id ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const statusQ = useQuery({
    queryKey: ["onboarding-status", userId],
    queryFn: () => statusFn(),
    enabled: !!userId,
    staleTime: 60_000,
  });

  // Public visitors and admins-in-progress still see the section normally,
  // because Finance/Governance themselves render a "Sign in" CTA inside.
  // We only block authenticated users who haven't completed onboarding.
  if (!userId || statusQ.isLoading || statusQ.data?.complete !== false) {
    return <>{children}</>;
  }

  return (
    <Section id={id}>
      <SectionHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-gold/30 bg-gold/5 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/20 text-clay">
          <Lock className="h-5 w-5" />
        </div>
        <h3 className="mt-5 font-display text-2xl">Finish setting up your profile</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          We need your name and M-Pesa phone before opening wallets, SACCO circles, and
          governance votes. Takes under a minute.
        </p>
        <Link to="/onboarding" className="mt-6 inline-block">
          <Button variant="forest">
            Complete onboarding <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </Section>
  );
}
