import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';

interface Bid {
  id: string;
  amount: number;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string | null;
  };
  manual_bidder_name?: string;
}

interface BidHistoryProps {
  lotId?: string;
}

export function BidHistory({ lotId }: BidHistoryProps) {
  const [bids, setBids] = useState<Bid[]>([]);

  useEffect(() => {
    if (!lotId) return;

    const fetchBids = async () => {
      const { data, error } = await supabase
        .from('bids')
        .select('*, profiles:profiles_public(full_name)')
        .eq('lot_id', lotId)
        .order('amount', { ascending: false });
      
      if (!error && data) {
        setBids(data as any);
      }
    };

    fetchBids();

    const channel = supabase
      .channel(`bids-${lotId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'bids', 
        filter: `lot_id=eq.${lotId}` 
      }, (payload) => {
        const newBid = payload.new as any;
        
        // Add bid immediately
        setBids(prev => {
          if (prev.some(b => b.id === newBid.id)) return prev;
          return [...prev, newBid].sort((a, b) => b.amount - a.amount);
        });

        // Fetch profile in background
        supabase
          .from('profiles_public')
          .select('full_name')
          .eq('id', newBid.user_id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              setBids(prev => prev.map(b => 
                b.id === newBid.id ? { ...b, profiles: profile } : b
              ));
            }
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lotId]);

  const fmtBRL = (v: number) => formatCurrency(v);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <aside className="w-full bg-brand-950/40 backdrop-blur-md rounded-3xl border border-white/10 flex flex-col shadow-2xl overflow-hidden h-full">
      <header className="p-5 border-b border-white/10 flex items-center justify-between bg-brand-900/40">
        <h2 className="font-black text-xs uppercase tracking-widest text-white/90">Histórico de Lances</h2>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-red-600 animate-pulse" />
          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">LIVE</span>
        </div>
      </header>
      <ul className="flex-1 p-3 space-y-2 overflow-y-auto custom-scrollbar">
        {bids.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3 opacity-50">
            <div className="size-12 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
              <span className="text-xl">⏳</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Aguardando primeiro lance...</p>
          </div>
        ) : (
          bids.map((b, i) => {
            const isWinning = i === 0;
            const bidderName = b.manual_bidder_name || b.profiles?.full_name || 'Usuário Anônimo';
            
            return (
              <li
                key={b.id}
                className={
                  isWinning
                    ? "p-3 rounded-xl bg-gold/10 border border-gold/20 flex justify-between items-center animate-in fade-in slide-in-from-right-4 duration-500"
                    : "p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center opacity-70"
                }
              >
                <div className="flex items-center gap-3">
                  <div
                    className={
                      isWinning
                        ? "size-8 rounded-full bg-gold text-black grid place-items-center text-[10px] font-black"
                        : "size-8 rounded-full bg-white/10 text-white grid place-items-center text-[10px] font-black"
                    }
                  >
                    {getInitials(bidderName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[10px] font-black uppercase tracking-widest truncate ${isWinning ? "text-gold" : "text-white/70"}`}>
                      {bidderName} {isWinning && <span className="ml-1 text-[7px] bg-gold text-black px-1 py-0.5 rounded-sm">LÍDER</span>}
                    </p>
                    <p className="text-[8px] text-white/30 font-bold uppercase truncate">
                      {formatDistanceToNow(new Date(b.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
                <span className={`font-black tabular-nums text-sm ${isWinning ? "text-gold" : "text-white"}`}>
                  {fmtBRL(b.amount)}
                </span>
              </li>
            );
          })
        )}
      </ul>
      <footer className="p-4 bg-brand-900/60 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
            Total de Lances
          </span>
          <span className="text-[10px] font-black text-gold">
            {bids.length} LANCES
          </span>
        </div>
        <div className="mt-2 flex items-center justify-center gap-1.5 py-1.5 bg-black/40 rounded-lg border border-white/5">
           <ShieldCheck className="size-3 text-green-500/50" />
           <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em]">Auditoria de integridade verificada</span>
        </div>
      </footer>
    </aside>
  );
}