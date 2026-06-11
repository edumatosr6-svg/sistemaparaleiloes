import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MonitorPlay } from "lucide-react";

export function QuickBar() {
  const { data: liveAuction } = useQuery({
    queryKey: ['live-auction-now-quickbar'],
    queryFn: async () => {
      // Primeiro busca se há algum leilão com lote em disputa (is_running)
      const { data: liveControls } = await supabase
        .from('live_auction_control')
        .select('auction_id, auctions(id, title, status, streaming_active)')
        .eq('is_running', true);
      
      if (liveControls && liveControls.length > 0) {
        const auction = (liveControls[0] as any).auctions;
        if (auction && auction.status !== 'closed') {
          return auction;
        }
      }

      const { data, error } = await supabase
        .from('auctions')
        .select('id, title, streaming_active')
        .eq('streaming_active', true)
        .eq('status', 'active')
        .maybeSingle();
      if (error) return null;
      return data;
    },
    refetchInterval: 10000
  });

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-brand-950 text-primary-foreground px-4 md:px-6 py-3 rounded-full flex items-center gap-4 md:gap-8 shadow-glow border border-white/10 z-40 max-w-[calc(100vw-1rem)]">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-accent live-dot text-accent" />
        <span className="text-[10px] font-bold tracking-widest hidden sm:inline uppercase">Sistema Online</span>
      </div>
      
      <div className="h-4 w-px bg-white/20" />
      
      <div className="flex gap-4 md:gap-6 text-[11px] font-bold uppercase tracking-tight">
        <Link to="/" className="text-brand-500 font-black">Catálogo</Link>
        <Link to="/painel" className="hover:text-brand-500 transition-colors">Painel</Link>
        <Link to="/painel/pagamentos" className="hover:text-brand-500 transition-colors">Pagar</Link>
        <Link to="/painel/documentos" className="hover:text-brand-500 transition-colors hidden sm:inline">Contratos</Link>
      </div>
    </div>
  );
}
