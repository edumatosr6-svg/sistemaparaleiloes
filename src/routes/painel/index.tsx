import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/painel/DashboardLayout';
import { DashboardOverview } from '@/components/painel/DashboardOverview';

export const Route = createFileRoute('/painel/')({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardOverview />
    </DashboardLayout>
  );
}
