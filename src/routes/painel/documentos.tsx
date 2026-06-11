import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/painel/DashboardLayout';
import { DocumentsSection } from '@/components/painel/DocumentsSection';

export const Route = createFileRoute('/painel/documentos')({
  component: DocumentsPage,
});

function DocumentsPage() {
  return (
    <DashboardLayout>
      <DocumentsSection />
    </DashboardLayout>
  );
}
