
-- Audit log
CREATE TABLE public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  target_user_id uuid,
  target_id text,
  amount numeric,
  memo text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_actions TO authenticated;
GRANT ALL ON public.admin_actions TO service_role;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_actions admin read"
  ON public.admin_actions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_actions admin insert"
  ON public.admin_actions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND actor_id = auth.uid());

-- Missing wallet_transactions insert policy (members topping up their own wallet)
CREATE POLICY "wallet tx self insert"
  ON public.wallet_transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

GRANT INSERT ON public.wallet_transactions TO authenticated;
