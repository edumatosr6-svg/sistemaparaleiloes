import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/painel/DashboardLayout';
import { FinancialSection } from '@/components/painel/FinancialSection';

export const Route = createFileRoute('/painel/saldo')({
  component: BalancePage,
});

function BalancePage() {
  return (
    <DashboardLayout>
      <FinancialSection />
    </DashboardLayout>
  );
}
