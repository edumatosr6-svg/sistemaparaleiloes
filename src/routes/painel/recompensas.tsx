import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/painel/DashboardLayout';
import { LoyaltyPanel } from '@/components/leilao/LoyaltyPanel';

export const Route = createFileRoute('/painel/recompensas')({
  component: RewardsPage,
});

function RewardsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-brand-100">Hero Rewards</h1>
        <LoyaltyPanel />
      </div>
    </DashboardLayout>
  );
}
