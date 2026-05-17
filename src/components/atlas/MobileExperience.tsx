import { Section, SectionHeader } from "./Section";
import { MessageCircle, Wifi, Languages, Bike } from "lucide-react";

export function MobileExperience() {
  return (
    <Section id="mobile" className="bg-muted/30">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeader
            eyebrow="Mobile-first"
            title={<>Built for the phones <span className="text-gradient-forest">people actually use.</span></>}
            description="WhatsApp orders, SMS confirmations, low-bandwidth UI, and Kiswahili-first interfaces — because operational reality matters more than aesthetics."
          />

          <div className="mt-8 space-y-3">
            {[
              { icon: MessageCircle, title: "WhatsApp ordering", body: "Order your food box, request a pickup, or pay an invoice — all via chat." },
              { icon: Wifi, title: "Low-bandwidth design", body: "Every screen ships under 80kb. Works on 2G in Kawangware." },
              { icon: Languages, title: "Kiswahili & local languages", body: "Sheng', Dholuo, Kikuyu, Kalenjin coming via community translators." },
              { icon: Bike, title: "Rider coordination", body: "Riders get one screen: pickup, drop, paid. No clutter." },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="flex gap-4 rounded-2xl border border-border bg-card p-4">
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-forest-deep/5 text-forest-deep">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{c.title}</div>
                    <div className="mt-0.5 text-sm text-muted-foreground">{c.body}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* WhatsApp-style mockup */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="rounded-3xl border border-border bg-card p-3 shadow-[var(--shadow-elevated)]">
            <div className="rounded-2xl bg-[#e5ddd5] p-4">
              <div className="mb-3 flex items-center gap-2 text-xs text-foreground/70">
                <div className="h-7 w-7 rounded-full bg-forest" />
                <div>
                  <div className="text-xs font-medium text-foreground">Atlas · Westlands</div>
                  <div className="text-[10px] text-foreground/60">online</div>
                </div>
              </div>

              {[
                { from: "atlas", text: "Habari Achieng'! Your weekly box is ready. Confirm delivery for Thu 4–6pm?" },
                { from: "me", text: "Sawa. Add a tray of eggs please." },
                { from: "atlas", text: "Done ✓ Total KSh 1,930 · pay via M-Pesa Paybill 4421000. Reply 1 to confirm." },
                { from: "me", text: "1" },
                { from: "atlas", text: "Asante 🌱 Brian (rider) will reach you 4:15pm. Track: m.atlas.ke/b/8214" },
              ].map((m, i) => (
                <div
                  key={i}
                  className={`mb-2 flex ${m.from === "me" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                      m.from === "me"
                        ? "rounded-br-md bg-[#dcf8c6] text-ink"
                        : "rounded-bl-md bg-white text-ink"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
