import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Gavel, Award, Phone, Globe, Cpu } from 'lucide-react';
import type { Bid, Lot } from '@/types/auction';
import { cn, formatCurrency } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';

interface BidRankingProps {
  lot: Lot | null;
  bids: Bid[];
  currentUserId?: string;
}

export function BidRanking({ lot, bids, currentUserId }: BidRankingProps) {
  const [sortedBids, setSortedBids] = useState<Bid[]>([]);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Show a larger history if virtualized, e.g., last 50 bids
    const sorted = [...bids]
      .sort((a, b) => {
        // High priority: Amount descending
        if (Number(b.amount) !== Number(a.amount)) return Number(b.amount) - Number(a.amount);
        // Secondary priority: Time descending (newest first for the same amount - although should be unique per time in theory)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 100); // Increased limit for better history visibility
    setSortedBids(sorted);
  }, [bids]);

  const rowVirtualizer = useVirtualizer({
    count: sortedBids.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated height of each bid row
    overscan: 5,
  });

  return (
    <Card className="flex flex-col h-full border-brand-800 bg-brand-950/50 backdrop-blur-sm shadow-xl overflow-hidden">
      <CardHeader className="p-4 border-b border-brand-800 bg-brand-900/50 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-brand-100">
            <TrendingUp className="size-4 text-green-400" />
            Quadro de Propostas
          </CardTitle>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black text-green-400 uppercase tracking-tighter">Tempo Real</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden relative">
        <div 
          ref={parentRef} 
          className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-brand-800"
        >
          {sortedBids.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] px-8 text-center group">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gold/10 blur-2xl rounded-full" />
                <div className="size-16 rounded-2xl bg-brand-900 border border-brand-800 flex items-center justify-center relative group-hover:border-gold/30 transition-colors">
                  <Gavel className="size-8 text-brand-700 group-hover:text-gold/50 transition-colors" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black text-brand-100 uppercase tracking-tighter italic">Pista Aberta para Lances</p>
                <p className="text-[10px] font-medium text-brand-500 uppercase tracking-widest leading-relaxed">
                  Aguardando primeiro lance... Seja o primeiro a disputar este lote!
                </p>
              </div>
              <div className="mt-8 size-1 rounded-full bg-gold animate-ping" />
            </div>
          ) : (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const bid = sortedBids[virtualRow.index];
                const index = virtualRow.index;
                
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className={cn(
                      "flex items-center justify-between p-4 transition-all group border-b border-brand-800/20 relative overflow-hidden",
                      index === 0 
                        ? "bg-gradient-to-r from-green-500/20 via-green-500/5 to-transparent border-l-4 border-l-green-500 shadow-[inset_4px_0_20px_rgba(34,197,94,0.1)]" 
                        : "hover:bg-brand-900/30",
                      bid.user_id === currentUserId && index !== 0 && "border-l-4 border-l-blue-500 bg-blue-500/5"
                    )}
                  >
                    {index === 0 && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    )}
                    
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="relative">
                        <span
                          className={cn(
                            "font-black w-9 h-9 flex items-center justify-center rounded-xl text-sm transition-all duration-500 group-hover:scale-110",
                            index === 0
                              ? 'bg-gold text-black shadow-[0_0_20px_rgba(255,215,0,0.4)] animate-pulse'
                              : index === 1
                              ? 'bg-slate-300 text-black shadow-lg'
                              : index === 2
                              ? 'bg-amber-700 text-white shadow-lg'
                              : 'bg-brand-800 text-brand-400'
                          )}
                        >
                          {index + 1}
                        </span>
                        {index === 0 && (
                          <div className="absolute -top-3 -right-3 rotate-12">
                            <Award className="size-6 text-gold fill-gold animate-bounce drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            bid.user_id === currentUserId && !bid.manual_bidder_name ? "text-blue-400" : "text-brand-100"
                          )}>
                            {bid.manual_bidder_name 
                              ? bid.manual_bidder_name 
                              : bid.user_id === currentUserId 
                                ? 'Seu Lance' 
                                : (bid as any).profiles?.full_name || 'Licitante Verificado'}
                          </p>
                          {index === 0 && (
                            <span className="text-[8px] font-black bg-green-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">LIDERANDO</span>
                          )}
                        </div>
                        <p className="text-lg font-black text-white tabular-nums tracking-tighter">
                          {formatCurrency(bid.amount)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="text-[10px] font-black text-brand-400 tabular-nums">
                        {new Date(bid.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                      <div className="flex items-center gap-1">
                        {bid.bid_source === 'phone' ? (
                          <>
                            <Phone className="size-2 text-gold" />
                            <span className="text-[8px] font-black text-gold uppercase tracking-tighter">Telefone</span>
                          </>
                        ) : bid.bid_source === 'automatic' || bid.is_automatic ? (
                          <>
                            <Cpu className="size-2 text-blue-400" />
                            <span className="text-[8px] font-black text-blue-400 uppercase tracking-tighter">Automático</span>
                          </>
                        ) : (
                          <>
                            <Globe className="size-2 text-brand-600" />
                            <span className="text-[8px] font-black text-brand-600 uppercase tracking-tighter">Web/App</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
