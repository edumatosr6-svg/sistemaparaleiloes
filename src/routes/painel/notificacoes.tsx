import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/painel/DashboardLayout';
import { NotificationsSection } from '@/components/painel/NotificationsSection';

export const Route = createFileRoute('/painel/notificacoes')({
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <DashboardLayout>
      <NotificationsSection />
    </DashboardLayout>
  );
}
