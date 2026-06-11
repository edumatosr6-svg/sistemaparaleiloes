import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalyticsRoute,
});

function AdminAnalyticsRoute() {
  return (
    <div className="space-y-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-2">Painel Analytics</h1>
          <p className="text-slate-500 font-medium text-sm">Monitoramento de desempenho e métricas em tempo real.</p>
        </div>
      </div>
      <AdminAnalytics />
    </div>
  );
}

