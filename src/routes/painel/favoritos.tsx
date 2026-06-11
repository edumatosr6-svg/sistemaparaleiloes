import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/painel/DashboardLayout';
import { FavoritesSection } from '@/components/painel/FavoritesSection';

export const Route = createFileRoute('/painel/favoritos')({
  component: FavoritesPage,
});

function FavoritesPage() {
  return (
    <DashboardLayout>
      <FavoritesSection />
    </DashboardLayout>
  );
}
