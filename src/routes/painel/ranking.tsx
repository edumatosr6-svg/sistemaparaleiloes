import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/painel/DashboardLayout';
import { GlobalRanking } from '@/components/leilao/GlobalRanking';

export const Route = createFileRoute('/painel/ranking')({
  component: RankingPage,
});

function RankingPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-brand-100">Ranking Global</h1>
        <GlobalRanking />
      </div>
    </DashboardLayout>
  );
}
