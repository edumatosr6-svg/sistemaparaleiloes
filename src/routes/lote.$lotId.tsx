import { createFileRoute } from "@tanstack/react-router";
import { LotPage } from "@/components/leilao/LotPage";
import { SiteHeader } from "@/components/leilao/SiteHeader";
import { SiteFooter } from "@/components/leilao/SiteFooter";
import { QuickBar } from "@/components/leilao/QuickBar";

export const Route = createFileRoute("/lote/$lotId")({
  component: LotPageRoute,
});

function LotPageRoute() {
  const { lotId } = Route.useParams();
  return (
    <div className="min-h-screen bg-brand-950">
      <SiteHeader />
      <main className="w-full py-10 pb-32">
        <LotPage lotId={lotId} />
      </main>
      <SiteFooter />
      <QuickBar />
    </div>
  );
}
