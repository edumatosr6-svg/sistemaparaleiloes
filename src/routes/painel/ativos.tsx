import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/painel/DashboardLayout';
import { BidsSection } from '@/components/painel/BidsSection';

export const Route = createFileRoute('/painel/ativos')({
  component: ActivePage,
});

function ActivePage() {
  return (
    <DashboardLayout>
      <BidsSection type="active" />
    </DashboardLayout>
  );
}
