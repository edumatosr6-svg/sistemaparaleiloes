import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/painel/DashboardLayout';
import { BidsSection } from '@/components/painel/BidsSection';

export const Route = createFileRoute('/painel/meus-lances')({
  component: BidsPage,
});

function BidsPage() {
  return (
    <DashboardLayout>
      <BidsSection type="all" />
    </DashboardLayout>
  );
}
