import { createFileRoute } from "@tanstack/react-router";
import { AuctionPage } from "@/components/leilao/AuctionPage";
import { SiteHeader } from "@/components/leilao/SiteHeader";
import { SiteFooter } from "@/components/leilao/SiteFooter";
import { QuickBar } from "@/components/leilao/QuickBar";

export const Route = createFileRoute("/leilao/$auctionId")({
  component: AuctionPageRoute,
});

function AuctionPageRoute() {
  const { auctionId } = Route.useParams();
  return (
    <div className="min-h-screen bg-brand-950">
      <SiteHeader />
      <main className="w-full pb-28">
        <AuctionPage auctionId={auctionId} />
      </main>
      <SiteFooter />
      <QuickBar />
    </div>
  );
}
