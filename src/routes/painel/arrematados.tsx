import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/painel/DashboardLayout';
import { BidsSection } from '@/components/painel/BidsSection';

export const Route = createFileRoute('/painel/arrematados')({
  component: WonPage,
});

function WonPage() {
  return (
    <DashboardLayout>
      <BidsSection type="won" />
    </DashboardLayout>
  );
}
