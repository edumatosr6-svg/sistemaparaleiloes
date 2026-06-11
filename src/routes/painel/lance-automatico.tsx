import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/painel/DashboardLayout';
import { AutoBidSection } from '@/components/painel/AutoBidSection';

export const Route = createFileRoute('/painel/lance-automatico')({
  component: AutoBidPage,
});

function AutoBidPage() {
  return (
    <DashboardLayout>
      <AutoBidSection />
    </DashboardLayout>
  );
}
