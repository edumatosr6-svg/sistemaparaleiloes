import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/painel/DashboardLayout';
import { FinancialSection } from '@/components/painel/FinancialSection';

export const Route = createFileRoute('/painel/pagamentos')({
  component: PaymentsPage,
});

function PaymentsPage() {
  return (
    <DashboardLayout>
      <FinancialSection />
    </DashboardLayout>
  );
}
