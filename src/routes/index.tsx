import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/atlas/Nav";
import { Hero } from "@/components/atlas/Hero";
import { ImpactDashboard } from "@/components/atlas/ImpactDashboard";
import { Marketplace } from "@/components/atlas/Marketplace";
import { Community } from "@/components/atlas/Community";
import { FarmOps } from "@/components/atlas/FarmOps";
import { WasteFlow } from "@/components/atlas/WasteFlow";
import { FoodBox } from "@/components/atlas/FoodBox";
import { AIEngine } from "@/components/atlas/AIEngine";
import { Finance } from "@/components/atlas/Finance";
import { Governance } from "@/components/atlas/Governance";
import { MobileExperience } from "@/components/atlas/MobileExperience";
import { Vision } from "@/components/atlas/Vision";
import { Footer } from "@/components/atlas/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atlas Sanctum — Regenerative OS for Africa" },
      {
        name: "description",
        content:
          "Atlas Sanctum is the regenerative economic operating system connecting farms, households, businesses, and communities across Africa.",
      },
      { property: "og:title", content: "Atlas Sanctum — Regenerative OS for Africa" },
      {
        property: "og:description",
        content:
          "Connecting farms, households, businesses, and communities into one regenerative economic network.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Sora:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <Hero />
        <ImpactDashboard />
        <Marketplace />
        <Community />
        <FarmOps />
        <WasteFlow />
        <FoodBox />
        <AIEngine />
        <Finance />
        <Governance />
        <MobileExperience />
        <Vision />
      </main>
      <Footer />
    </div>
  );
}
