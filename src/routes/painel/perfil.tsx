import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/painel/DashboardLayout';
import { ProfileSection } from '@/components/painel/ProfileSection';

export const Route = createFileRoute('/painel/perfil')({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <DashboardLayout>
      <ProfileSection />
    </DashboardLayout>
  );
}
