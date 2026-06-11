import { motion } from 'framer-motion';
import { SkeletonPremium } from '@/components/ui/skeleton-premium';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Gavel, Clock, ArrowRight, TrendingUp, Users, CheckCircle2, Trophy, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from '@tanstack/react-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { LotCard } from '@/components/leilao/LotCard';
import { SmartImage } from '../SmartImage';

function AuctionCountdown({ control }: { control: any }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!control?.current_lot_started_at || !control?.lot_time_limit_seconds || !control?.is_running) {
      setTimeLeft(0);
      return;
    }

    const update = () => {
      const start = new Date(control.current_lot_started_at).getTime();
      const limit = control.lot_time_limit_seconds * 1000;
      const now = new Date().getTime();
      const elapsed = now - start;
      setTimeLeft(Math.max(0, Math.floor((limit - elapsed) / 1000)));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [control]);

  if (timeLeft <= 0) return null;

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  return (
    <div className={cn(
      "flex items-center gap-1.5 tabular-nums text-[10px] sm:text-xs",
      timeLeft < 10 ? "text-red-500 animate-pulse" : "text-gold"
    )}>
      <Clock className="size-2.5 sm:size-3" />
      <span className="font-black">{mm}:{ss}</span>
    </div>
  );
}

export function LiveAuctionsSection({ content }: { content?: any }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true
  });

  const [auctions, setAuctions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuctions = useCallback(async () => {
    const { data, error } = await supabase
      .from('auctions')
      .select(`
        *,
        lots(
          id,
          bids(id)
        ),
        live_control:live_auction_control(*)
      `)
      .eq('status', 'active')
      .gt('ends_at', new Date().toISOString())
      .order('starts_at', { ascending: true });
    
    if (!error) {
      setAuctions(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAuctions();

    const channel = supabase
      .channel('live-auctions-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_auction_control'
        },
        () => {
          fetchAuctions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auctions',
          filter: 'status=eq.active'
        },
        () => {
          fetchAuctions();
        }
      )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'bids'
          },
          () => {
            fetchAuctions();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAuctions]);

  return (
    <section className="py-24 px-4 lg:px-12 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-gold animate-pulse" />
              <span className="label-premium text-gold">{content?.subtitle || "Próximas Oportunidades"}</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl section-title text-white">
              {content?.title || (auctions?.some(a => new Date(a.starts_at) <= new Date()) ? 'Eventos ao Vivo Agora' : 'Próximos Grandes Eventos')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-full px-8" asChild>
              <Link to="/">Ver Todos</Link>
            </Button>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                className="rounded-full size-10 border-white/10 text-white hover:bg-white/10"
                onClick={() => emblaApi?.scrollPrev()}
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="rounded-full size-10 border-white/10 text-white hover:bg-white/10"
                onClick={() => emblaApi?.scrollNext()}
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>
          </div>

        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-4">
                <SkeletonPremium className="aspect-[16/10] w-full rounded-[2.5rem]" />
                <div className="space-y-2">
                  <SkeletonPremium className="h-6 w-3/4" />
                  <SkeletonPremium className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : auctions?.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[4rem] bg-brand-900/40 border-2 border-brand-800/50 p-16 md:p-32 text-center group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-brand-500/5 opacity-50" />
            <div className="absolute -top-24 -right-24 size-96 bg-gold/5 blur-[120px] rounded-full group-hover:bg-gold/10 transition-colors duration-1000" />
            <div className="absolute -bottom-24 -left-24 size-96 bg-brand-500/5 blur-[120px] rounded-full group-hover:bg-brand-500/10 transition-colors duration-1000" />
            
            <div className="relative z-10 max-w-2xl mx-auto space-y-10">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gold/20 blur-3xl rounded-full animate-pulse" />
                <div className="size-28 rounded-[2.5rem] bg-brand-800 border-2 border-brand-700 flex items-center justify-center mx-auto mb-8 shadow-2xl relative group-hover:border-gold/50 transition-colors">
                  <Clock className="size-12 text-gold animate-spin-slow" />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-5xl md:text-7xl section-title text-white">
                  Silêncio no Auditório
                </h3>
                <p className="text-brand-400 text-xl font-medium leading-relaxed italic">
                  No momento todos os martelos estão em repouso. Estamos preparando o próximo evento de alto nível para você.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
                <Button size="lg" className="h-20 px-12 rounded-full" asChild>
                  <Link to="/">Ver Agenda Completa</Link>
                </Button>
                <div className="flex flex-col items-center sm:items-start gap-1">
                  <span className="text-[10px] font-black text-gold uppercase tracking-[0.2em] animate-pulse">Acompanhe</span>
                  <span className="text-brand-500 text-xs font-bold uppercase tracking-widest">Novidades em breve</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-8 md:gap-10 py-10 px-4 md:px-12">
              {auctions?.map((auction, i) => (
                <div key={auction.id} className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="group cursor-pointer shadow-2xl bg-brand-900 border-2 border-brand-800 hover:border-gold/50 transition-all duration-500 rounded-[3rem] relative hover:shadow-[0_0_50px_rgba(212,175,55,0.2)] hover:scale-[1.02] isolation-auto" asChild>
                      <Link to={`/leilao/${auction.id}`} className="block p-3">
                        <div className="relative aspect-[16/10] overflow-hidden bg-gray-200 rounded-[2.5rem]">
                          <SmartImage
                            src={auction.image_url || "/placeholder.svg"}
                            alt={auction.title}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder.svg";
                            }}
                          />
                          <div className="absolute top-4 left-4 flex gap-2">
                            {new Date(auction.starts_at) > new Date() ? (
                              <div className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-lg shadow-blue-500/20 flex items-center gap-1.5">
                                <Clock className="w-3 h-3" /> EM BREVE
                              </div>
                            ) : (
                              <div className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-lg shadow-red-500/20 flex items-center gap-1.5 animate-pulse border border-red-500">
                                <div className="flex items-center bg-white text-red-600 px-1.5 py-0.5 rounded-sm text-[8px] font-black mr-0.5">LIVE</div>
                                AO VIVO
                              </div>
                            )}
                            <div className="bg-gold text-black text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-lg shadow-gold/20">{auction.type === 'live' ? 'Auditório' : 'Simultâneo'}</div>
                          </div>
                          <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md text-white px-5 py-3 rounded-2xl flex flex-col items-end gap-0.5 shadow-2xl border border-white/10">
                            {new Date(auction.starts_at) > new Date() ? (
                              <div className="flex flex-col items-end">
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Inicia em</p>
                                <div className="text-gold font-black text-sm flex items-center gap-2">
                                  {format(new Date(auction.starts_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                </div>
                              </div>
                            ) : auction.live_control?.[0] && auction.live_control[0].is_running ? (
                              <div className="flex flex-col items-end">
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Status do Lote</p>
                                <AuctionCountdown control={auction.live_control[0]} />
                              </div>
                            ) : (
                              <div className="flex flex-col items-end">
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Duração</p>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gold">
                                  <Clock className="w-3 h-3" />
                                  <span>Finaliza {format(new Date(auction.ends_at), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <CardContent className="p-8">
                          <h3 className="card-title text-xl text-white group-hover:text-gold transition-colors">{auction.title}</h3>
                          <div className="flex items-center justify-between text-xs text-brand-400 font-bold uppercase tracking-wider pb-6 border-b border-white/10">
                            <div className="flex flex-col gap-1">
                              <span>{auction.lots?.length || 0} Lotes Cadastrados</span>
                              {auction.type === 'live' && auction.live_control?.[0]?.current_lot_id && (
                                <span className="text-gold animate-pulse text-[9px] flex items-center gap-1">
                                  <Gavel className="size-3" /> Lote em Disputa
                                </span>
                              )}
                            </div>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="size-3 text-gold" />
                              Acompanhar
                            </span>
                          </div>
                          <div className="mt-6 flex items-center justify-between gap-4">
                            <div className={cn(
                              "flex-1 rounded-full border border-white/10 text-white font-black uppercase tracking-widest text-[10px] h-12 flex items-center justify-center bg-white/5 transition-all group-hover:border-gold/50 group-hover:text-gold",
                              new Date(auction.starts_at) > new Date() ? "group-hover:border-blue-500 group-hover:text-blue-500" : ""
                            )}>
                              {new Date(auction.starts_at) > new Date() ? 'Ver Lotes' : 'Entrar na Sala'}
                            </div>
                            <div className={cn(
                              "size-12 rounded-full text-white flex items-center justify-center shrink-0 transition-all group-hover:rotate-[-45deg] border border-white/10 bg-white/5 group-hover:border-gold/50 group-hover:text-gold",
                              new Date(auction.starts_at) > new Date() ? "group-hover:border-blue-500 group-hover:text-blue-500" : ""
                            )}>
                              <ArrowRight className="size-5" />
                            </div>
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function CurrentLotHighlight({ content }: { content?: any }) {
  const [highlights, setHighlights] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const fetchHighlights = useCallback(async () => {
    // First try to find all running lots
    const { data: activeControls, error: activeError } = await supabase
      .from('live_auction_control')
      .select(`
        is_running,
        current_lot_id,
        current_lot_started_at,
        lot_time_limit_seconds,
        auctions:auction_id(title, id, starts_at),
        lot:current_lot_id(
          *,
          bids:bids(count)
        )
      `)
      .eq('is_running', true);
    
    if (!activeError && activeControls && activeControls.length > 0) {
      // Filter out lots that are already sold or not active
      const validLiveHighlights = activeControls.filter(c => (c.lot as any)?.status === 'active');
      
      if (validLiveHighlights.length > 0) {
        setHighlights(validLiveHighlights.map(c => ({ ...c, type: 'live' })));
        return;
      }
    }

    // If no running lots, look for upcoming highlight lots
    const { data: upcomingLots, error: upcomingError } = await supabase
      .from('lots')
      .select(`
        *,
        auctions:auction_id(title, id, starts_at, ends_at),
        bids:bids(count)
      `)
      .eq('is_highlight', true)
      .gt('auctions.ends_at', new Date().toISOString())
      .order('created_at', { ascending: true });

    if (!upcomingError && upcomingLots && upcomingLots.length > 0) {
      setHighlights(upcomingLots.map(l => ({ lot: l, auctions: l.auctions, type: 'upcoming' })));
    } else {
      setHighlights([]);
    }
  }, []);

  const highlightsRef = useRef(highlights);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => {
    highlightsRef.current = highlights;
  }, [highlights]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    fetchHighlights();

    const channel = supabase
      .channel('live-highlight')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_auction_control'
        },
        () => {
          fetchHighlights();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lots'
        },
        (payload) => {
          const currentHighlight = highlightsRef.current[currentIndexRef.current];
          if (payload.new && (currentHighlight?.lot?.id === payload.new.id || currentHighlight?.current_lot_id === payload.new.id)) {
            fetchHighlights();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids'
        },
        (payload) => {
          if (payload.new && highlightsRef.current[currentIndexRef.current]?.current_lot_id === payload.new.lot_id) {
            fetchHighlights();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchHighlights]);

  // Rotation logic
  useEffect(() => {
    if (highlights.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % highlights.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [highlights.length]);

  // Timer logic for current highlight
  useEffect(() => {
    const activeControl = highlights[currentIndex];
    if (activeControl?.type === 'live' && activeControl.current_lot_started_at && activeControl.lot_time_limit_seconds) {
      const update = () => {
        const start = new Date(activeControl.current_lot_started_at).getTime();
        const limit = activeControl.lot_time_limit_seconds * 1000;
        const now = new Date().getTime();
        const elapsed = now - start;
        setTimeLeft(Math.max(0, Math.floor((limit - elapsed) / 1000)));
      };
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(0);
    }
  }, [highlights, currentIndex]);

  if (highlights.length === 0 || !highlights[currentIndex]?.lot || !highlights[currentIndex]?.auctions) return null;

  const highlight = highlights[currentIndex];
  const lot = highlight.lot;
  const auction = highlight.auctions;
  
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');


  return (
    <section className="py-24 px-4 lg:px-12 bg-black overflow-hidden relative border-y border-gold/20">
      <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-transparent to-gold/10 animate-pulse" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="w-full lg:w-1/2 relative group">
            <div className="absolute -inset-4 bg-gold/20 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
            <Link to={`/leilao/${auction.id}`}>
              <Card className="border-2 border-brand-800 bg-brand-950/40 backdrop-blur-md shadow-2xl relative rounded-[3rem] p-3 md:p-4 hover:border-gold/50 transition-all duration-500">
                <div className="aspect-[16/10] relative overflow-hidden rounded-[2.5rem]">
                  <SmartImage 
                    src={lot.image_url || "/placeholder.svg"}
                    alt={lot.title} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  {highlight.type === 'live' ? (
                    <div className={cn(
                      "absolute top-6 left-6 text-white text-[10px] font-black px-4 py-1.5 rounded-full animate-pulse uppercase tracking-[0.2em]",
                      lot.status === 'sold' ? "bg-green-600" : "bg-red-600"
                    )}>
                      {lot.status === 'sold' ? 'Arrematado' : 'Em Disputa Agora'}
                    </div>
                  ) : (
                    <div className="absolute top-6 left-6 bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] flex items-center gap-2">
                      <Clock className="size-3" /> Próximo Lote Destaque
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          </div>
          
          <div className="w-full lg:w-1/2 space-y-8">
            <div className="space-y-4">
              <p className="text-gold font-black uppercase tracking-[0.3em] text-xs">
                {content?.subtitle || (highlight.type === 'live' ? 'Oportunidade de Ouro' : 'Prepare-se para Arrematar')}
              </p>
              <h2 className="text-5xl md:text-7xl section-title text-white italic">
                {lot.title}
              </h2>
              <p className="text-white/60 text-lg font-medium leading-tight">
                {highlight.type === 'live' 
                  ? `Faz parte do evento ${auction.title}. Não perca a chance de arrematar este item exclusivo.`
                  : `Este lote será aberto no evento ${auction.title}. Habilite-se agora para participar.`}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-12 border-y border-white/10 py-8">
              <div>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Lance Atual</p>
                <p className="text-4xl font-black text-white tracking-tighter tabular-nums">
                  R$ {(lot.current_highest_bid || lot.starting_price || 0).toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Incremento</p>
                <p className="text-2xl font-black text-gold tracking-tighter tabular-nums">
                  R$ {(lot.min_increment || 100).toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Lances</p>
                <p className="text-2xl font-black text-white tracking-tighter tabular-nums">
                  {lot.bids?.[0]?.count || 0}
                </p>
              </div>
              <div className="bg-white/5 px-6 py-2 rounded-2xl border border-white/10">
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                  {highlight.type === 'live' ? <Clock className="size-3 text-red-500 animate-pulse" /> : <Clock className="size-3 text-gold" />}
                  {highlight.type === 'live' ? 'Tempo Restante' : 'Abertura em'}
                </p>
                <p className={cn(
                  "text-3xl font-black tracking-tighter tabular-nums",
                  highlight.type === 'live' && (timeLeft < 10 || lot.status === 'sold') ? (lot.status === 'sold' ? "text-green-500" : "text-red-500 animate-pulse") : "text-white"
                )}>
                  {highlight.type === 'live' ? (lot.status === 'sold' ? "VENDIDO" : (timeLeft > 0 ? `${mm}:${ss}` : "LANCE FINAL")) : format(new Date(auction.starts_at), "dd/MM HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="h-16 md:h-20 px-12 bg-gold text-black hover:bg-gold-light rounded-full font-black text-lg uppercase tracking-widest shadow-glow-gold transition-all group relative overflow-hidden flex-1 sm:flex-none" asChild>
                <Link to={`/leilao/${auction.id}`}>
                  <span className="relative z-10 flex items-center">
                    {highlight.type === 'live' ? (lot.status === 'sold' ? 'VER RESULTADO' : 'DAR LANCE AGORA') : 'HABILITAR-SE'}
                    <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </span>
                  <motion.div 
                    className="absolute inset-0 bg-white/20"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-16 md:h-20 px-12 border-white/20 text-white hover:bg-white/5 rounded-full font-black text-sm uppercase tracking-widest transition-all flex-1 sm:flex-none" asChild>
                <Link to={`/lote/${lot.id}`}>
                  Ver Detalhes
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PlatformStatsSection({ content }: { content?: any }) {
  const stats = [
    { label: "Arrecadado", value: "R$ 142M", icon: TrendingUp },
    { label: "Lotes Vendidos", value: "+24.000", icon: Gavel },
    { label: "Usuários Ativos", value: "85.2k", icon: Users },
    { label: "Sucesso de Venda", value: "98.5%", icon: CheckCircle2 },
  ];

  return (
    <section className="py-32 px-4 lg:px-12 bg-brand-950 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.05)_0%,transparent_50%)]" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-16">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center md:text-left space-y-6 group"
            >
              <div className="size-16 rounded-[1.5rem] bg-brand-900 border border-brand-800 flex items-center justify-center mx-auto md:mx-0 group-hover:border-gold transition-colors duration-500 shadow-xl">
                <stat.icon className="size-8 text-gold group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="space-y-2">
                <p className="text-4xl md:text-6xl font-black tracking-tighter tabular-nums text-white group-hover:text-gold transition-colors">{stat.value}</p>
                <p className="text-xs font-black text-brand-500 uppercase tracking-[0.3em]">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CategoriesSection({ content }: { content?: any }) {
  const { data: categories } = useQuery({
    queryKey: ['home-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true })
        .limit(6);
      if (error) throw error;
      return data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always'
  });

  const displayCategories = categories && categories.length > 0 ? categories : [
    { id: '1', name: "Super-Heróis", slug: "super-herois", image: "/placeholder.svg" },
    { id: '2', name: "Vilões", slug: "viloes", image: "/placeholder.svg" },
    { id: '3', name: "Terror", slug: "terror", image: "/placeholder.svg" },
    { id: '4', name: "Anime", slug: "anime", image: "/placeholder.svg" },
    { id: '5', name: "Medievais", slug: "medievais", image: "/placeholder.svg" },
    { id: '6', name: "Disney", slug: "disney", image: "/placeholder.svg" },
  ];


  return (
    <section id="categorias" className="py-24 px-4 lg:px-12 bg-gray-50">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Background Ambient Light */}
        <div className="absolute top-0 right-0 size-[500px] bg-gold/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 size-[500px] bg-brand-500/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
        <div className="mb-12">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-gold mb-4">{content?.subtitle || "Explore por Segmento"}</p>
          <h2 className="text-5xl md:text-6xl section-title text-slate-900">{content?.title || "Categorias Populares"}</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {displayCategories.map((cat, i) => (
            <Link
              key={i}
              to="/categoria/$slug"
              params={{ slug: cat.slug }}
              className="group cursor-pointer aspect-square relative overflow-hidden rounded-3xl block"
            >
              <motion.div
                whileHover={{ y: -5 }}
                className="w-full h-full"
              >
              <SmartImage
                src={(cat as any).image || (cat as any).image_url || "/placeholder.svg"}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />

              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors" />
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <h3 className="text-white font-black text-lg">{cat.name}</h3>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Ver Itens</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TopBuyersSection({ content }: { content?: any }) {
  const buyers = [
    { name: "João Silva", amount: "R$ 1.2M", purchases: 12, avatar: "JS" },
    { name: "Maria Garcia", amount: "R$ 850k", purchases: 8, avatar: "MG" },
    { name: "Pedro Santos", amount: "R$ 620k", purchases: 15, avatar: "PS" },
    { name: "Ana Oliveira", amount: "R$ 450k", purchases: 5, avatar: "AO" },
  ];

  return (
    <section className="py-32 px-4 lg:px-12 bg-brand-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(212,175,55,0.05)_0%,transparent_50%)]" />
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div className="space-y-10">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-gold" />
              <span className="text-xs font-black uppercase tracking-[0.3em] text-gold">{content?.subtitle || "Comunidade VIP"}</span>
            </div>
            <h2 className="text-5xl md:text-8xl section-title text-white italic">{content?.title || "Hall da Fama de Investidores"}</h2>
            <p className="text-brand-400 text-lg font-medium leading-relaxed max-w-xl">
              Nossa plataforma é o ponto de encontro dos maiores colecionadores e investidores do Brasil. Disputas de alto nível com segurança absoluta.
            </p>
          </div>
          <div className="flex gap-6">
            <Button size="lg" className="h-16 px-12 rounded-full bg-gold text-black hover:bg-gold-light font-black uppercase tracking-widest text-xs shadow-glow-gold transition-all" asChild>
              <Link to="/entrar">Fazer Parte</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-16 px-12 rounded-full border-brand-800 text-white hover:bg-brand-800 font-black uppercase tracking-widest text-xs transition-all">Regulamento</Button>
          </div>
        </div>

        <div className="bg-brand-900 border border-brand-800 rounded-[3rem] p-10 md:p-16 space-y-10 shadow-2xl relative overflow-hidden group hover:border-gold/20 transition-all">
          <div className="absolute top-0 right-0 size-64 bg-gold/5 blur-[100px] rounded-full group-hover:bg-gold/10 transition-colors" />
          <h3 className="card-title text-2xl flex items-center gap-4 text-white">
            <Trophy className="size-8 text-gold animate-bounce" />
            Líderes do Mês
          </h3>
          <div className="space-y-8 relative z-10">
            {buyers.map((buyer, i) => (
              <div key={i} className="flex items-center justify-between group/item">
                <div className="flex items-center gap-6">
                  <div className="size-16 rounded-[1.5rem] bg-brand-800 border border-brand-700 flex items-center justify-center font-black text-xl text-white shadow-xl group-hover/item:border-gold transition-all group-hover/item:scale-110 duration-500">
                    {buyer.avatar}
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-lg text-white uppercase tracking-tight">{buyer.name}</p>
                    <p className="text-[10px] text-brand-500 font-black uppercase tracking-widest">{buyer.purchases} Arremates</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-2xl text-gold tabular-nums tracking-tighter">{buyer.amount}</p>
                  <p className="text-[10px] text-brand-500 font-black uppercase tracking-widest">Patrimônio</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturedLotsSection({ content }: { content?: any }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true
  });

  const { data: lots, isLoading } = useQuery({
    queryKey: ['featured-lots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lots')
        .select(`
          *,
          auctions:auction_id(title, status, ends_at)
        `)
        .eq('is_highlight', true)
        .eq('auctions.status', 'active')
        .gt('auctions.ends_at', new Date().toISOString())
        .limit(12);
      
      if (error) throw error;
      return data;
    }
  });

  if (!isLoading && (!lots || lots.length === 0)) return null;

  return (
    <section className="py-32 px-4 lg:px-12 bg-brand-950 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Ambient Light */}
        <div className="absolute top-0 right-0 size-[600px] bg-gold/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 size-[600px] bg-brand-500/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-gold animate-pulse" />
              <span className="label-premium text-gold">{content?.subtitle || "Seleção Exclusiva"}</span>
            </div>
            <h2 className="text-5xl md:text-8xl section-title text-white">{content?.title || "Oportunidades de Ouro"}</h2>
            <p className="text-brand-400 font-medium max-w-xl text-lg">
              Lotes selecionados criteriosamente por nossa curadoria para investidores que buscam raridade e valorização.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="rounded-full border-brand-800 text-white hover:bg-white hover:text-black font-black uppercase tracking-widest px-10 h-16 shadow-2xl transition-all hidden md:flex" asChild>
              <Link to="/">Ver Catálogo</Link>
            </Button>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                className="rounded-full size-12 border-brand-800 text-white hover:bg-brand-800"
                onClick={() => emblaApi?.scrollPrev()}
              >
                <ChevronLeft className="size-6" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="rounded-full size-12 border-brand-800 text-white hover:bg-brand-800"
                onClick={() => emblaApi?.scrollNext()}
              >
                <ChevronRight className="size-6" />
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-[4/5] bg-brand-900/50 rounded-[3rem] animate-pulse border border-brand-800" />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-8 md:gap-10 py-10">
              {lots?.map((lot, i) => (
                <div key={lot.id} className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0">
                  <LotCard lot={lot} delay={i * 0.1} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}


export function HowItWorksSection({ content }: { content?: any }) {
  const steps = [
    {
      title: "Habilitação",
      desc: "Cadastre-se e envie sua caução para se habilitar a dar lances nos lotes exclusivos.",
      icon: ShieldCheck
    },
    {
      title: "Auditoria",
      desc: "Todos os lances são auditados em tempo real, garantindo segurança total para o arrematante.",
      icon: Gavel
    },
    {
      title: "Arremate",
      desc: "Dê seu lance e acompanhe a disputa. O martelo bate para o maior lance validado.",
      icon: Trophy
    },
    {
      title: "Pagamento e Entrega",
      desc: "Após o arremate, realize o pagamento e receba seu item com certificação de autenticidade.",
      icon: CheckCircle2
    }
  ];

  return (
    <section className="py-32 px-4 lg:px-12 bg-brand-950 relative overflow-hidden" id="como-funciona">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.03)_0%,transparent_70%)]" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center space-y-6 mb-20">
          <div className="flex items-center justify-center gap-2">
            <span className="size-2 rounded-full bg-gold" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-gold">{content?.subtitle || "Experiência Mega Leilões"}</span>
          </div>
          <h2 className="text-5xl md:text-8xl section-title text-white italic">{content?.title || "Como funciona a jornada"}</h2>
          <p className="text-brand-400 max-w-2xl mx-auto font-medium text-lg leading-relaxed">
            Desenvolvemos um processo transparente, ágil e 100% seguro para você arrematar os melhores lotes do Brasil.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-10 rounded-[3rem] bg-brand-900/50 border border-brand-800 space-y-8 hover:border-gold/30 hover:shadow-[0_0_40px_rgba(212,175,55,0.1)] transition-all group"
            >
              <div className="size-20 rounded-[1.5rem] bg-brand-800 border border-brand-700 shadow-xl flex items-center justify-center group-hover:bg-gold group-hover:border-gold transition-colors duration-500">
                <step.icon className="size-10 text-gold group-hover:text-black transition-colors duration-500" />
              </div>
              <div className="space-y-4">
                <h3 className="card-title text-2xl text-white tracking-tight">{step.title}</h3>
                <p className="text-brand-400 text-sm leading-relaxed font-medium">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SecurityRulesSection({ content }: { content?: any }) {
  const rules = [
    {
      title: "Auditoria 24/7",
      desc: "Nossa inteligência artificial audita cada lance para evitar bots e garantir disputas justas.",
      icon: ShieldCheck
    },
    {
      title: "Garantia de Caução",
      desc: "A exigência de caução garante que apenas licitantes sérios participem, protegendo o vendedor e o arrematante.",
      icon: CheckCircle2
    },
    {
      title: "Anti-Sniper",
      desc: "Lances nos segundos finais estendem o tempo do lote, permitindo que todos tenham chance de contra-ofertar.",
      icon: Clock
    }
  ];

  return (
    <section className="py-24 px-4 lg:px-12 bg-brand-950 text-white relative overflow-hidden border-y border-brand-800/50">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {rules.map((rule, i) => (
            <div key={i} className="flex gap-8 items-start group">
              <div className="size-16 rounded-2xl bg-brand-900 border border-brand-800 flex items-center justify-center shrink-0 group-hover:border-gold/50 transition-colors duration-500 shadow-xl">
                <rule.icon className="size-8 text-gold group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="space-y-3">
                <h4 className="card-title text-xl text-white tracking-tight group-hover:text-gold transition-colors">{rule.title}</h4>
                <p className="text-brand-400 text-sm leading-relaxed font-medium">{rule.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
