import { createFileRoute, Link } from '@tanstack/react-router';
import { SiteFooter } from '@/components/leilao/SiteFooter';
import { Button } from '@/components/ui/button';
import { LayoutGrid } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LivePlayer } from '@/components/leilao/LivePlayer';
import { LiveAuctionPanel } from '@/components/leilao/LiveAuctionPanel';
import { BidHistory } from '@/components/leilao/BidHistory';
import { VirtualAuditor } from '@/components/leilao/VirtualAuditor';
import { DepositModal } from '@/components/leilao/DepositModal';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SkeletonPremium } from '@/components/ui/skeleton-premium';
import { useAuth } from '@/hooks/useAuth';
import { Auction, Lot } from '@/types/auction';
import { toast } from 'sonner';
import { Users, Clock, Gavel, ShieldCheck, ShieldAlert, Maximize2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { SmartImage } from '@/components/SmartImage';

export const Route = createFileRoute('/leilao/$auctionId/live')({
  component: LiveAuditoriumPage,
});

function LiveAuditoriumPage() {
  const { auctionId } = Route.useParams();
  const { user } = useAuth();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [currentLot, setCurrentLot] = useState<Lot | null>(null);
  const [lots, setLots] = useState<Lot[]>([]);
  const [auctionControl, setAuctionControl] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false); // Inativa por padrão no site público
  const [depositStatus, setDepositStatus] = useState<string | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [currentLeaderId, setCurrentLeaderId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchUserData = async () => {
      // Fetch role
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role === 'admin') {
        setIsAdmin(true);
      }

      // Fetch deposit status
      const { data: deposit } = await supabase
        .from('caucao')
        .select('status')
        .eq('user_id', user.id)
        .eq('auction_id', auctionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (deposit) {
        setDepositStatus(deposit.status);
      }
    };
    
    fetchUserData();
  }, [user, auctionId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: auctionData } = await supabase.from('auctions').select('*').eq('id', auctionId).single();
        setAuction(auctionData as any);

        const { data: lotsData } = await supabase.from('lots').select('*').eq('auction_id', auctionId).order('lot_order', { ascending: true });
        setLots(lotsData as any[] || []);

        const { data: controlData } = await supabase
          .from('live_auction_control')
          .select('*, current_lot:lots!current_lot_id(*)')
          .eq('auction_id', auctionId)
          .maybeSingle();
        
        setAuctionControl(controlData);
        if (controlData?.current_lot_id) {
          const { data: lotData, error: lotError } = await supabase
            .from('lots')
            .select('*')
            .eq('id', controlData.current_lot_id)
            .single();
          
          if (lotData) {
            setCurrentLot(lotData as any);
          } else if (controlData.current_lot) {
            // Fallback to joined data if single fetch fails
            setCurrentLot(controlData.current_lot as any);
          }
        } else {
          setCurrentLot(null);
        }
      } catch (err) {
        console.error('Error fetching live data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const channel = supabase
      .channel(`live-auditorium:${auctionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_auction_control', filter: `auction_id=eq.${auctionId}` }, async (payload) => {
        const newControl = payload.new as any;
        setAuctionControl((prev: any) => ({ ...prev, ...newControl }));
        
        const lotId = newControl.current_lot_id;
        if (lotId) {
          const { data: lot } = await supabase.from('lots').select('*').eq('id', lotId).single();
          if (lot) {
            setCurrentLot(lot as any);
          }
          
          if (newControl.auctioneer_status === 'dol1') {
            toast.info('DOU-LHE UMA!', { position: 'top-center', duration: 2000 });
          } else if (newControl.auctioneer_status === 'dol2') {
            toast.warning('DOU-LHE DUAS!', { position: 'top-center', duration: 2000 });
          } else if (newControl.auctioneer_status === 'sold') {
            toast.success('VENDIDO!', { position: 'top-center', duration: 3000 });
          }
        } else if (payload.eventType === 'UPDATE' && newControl.hasOwnProperty('current_lot_id') && !newControl.current_lot_id) {
          // Only set to null if current_lot_id is explicitly in the payload and is null
          setCurrentLot(null);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lots' }, (payload) => {
        const updatedLot = payload.new as any;
        setCurrentLot(prev => {
          if (prev?.id === updatedLot.id) {
            return { ...prev, ...updatedLot };
          }
          return prev;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [auctionId]);

  useEffect(() => {
    if (!currentLot?.id) {
      setCurrentLeaderId(null);
      return;
    }

    const fetchLeader = async () => {
      const { data, error } = await supabase
        .from('bids')
        .select('user_id')
        .eq('lot_id', currentLot.id)
        .order('amount', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setCurrentLeaderId(data.user_id === user?.id ? 'YOU' : data.user_id);
      } else {
        setCurrentLeaderId(null);
      }
    };

    fetchLeader();

    const channel = supabase
      .channel(`bids-leader-${currentLot.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids', filter: `lot_id=eq.${currentLot.id}` }, (payload) => {
        const newBid = payload.new as any;
        setCurrentLeaderId(newBid.user_id === user?.id ? 'YOU' : newBid.user_id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentLot?.id, user?.id]);

  useEffect(() => {
    if (!auctionControl?.is_running || !auctionControl?.current_lot_started_at) return;
    
    const calculateTime = () => {
      const startedAt = new Date(auctionControl.current_lot_started_at).getTime();
      const limit = (auctionControl.lot_time_limit_seconds || 60) * 1000;
      const now = Date.now();
      const diff = Math.max(0, Math.floor((startedAt + limit - now) / 1000));
      setTimeRemaining(diff);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [auctionControl?.is_running, auctionControl?.current_lot_started_at, auctionControl?.lot_time_limit_seconds]);

  if (loading) return <SkeletonPremium className="h-screen w-full" />;

  return (
    <div className="min-h-screen bg-brand-950 text-white flex flex-col font-sans overflow-x-hidden">
      {/* Header Fixo */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-4 md:px-8 bg-brand-950/80 backdrop-blur-xl z-50 sticky top-0 shrink-0 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-red-600 px-3 py-1 rounded-full animate-pulse shadow-glow-red border border-red-500/50">
            <div className="flex items-center bg-white text-red-600 px-1 py-0.5 rounded-sm text-[8px] font-black leading-none">LIVE</div>
            <span className="text-[10px] font-black tracking-[0.2em] text-white">AO VIVO</span>
          </div>
          <h1 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-white/90 truncate max-w-[150px] md:max-w-md">{auction?.title}</h1>
        </div>
        <div className="flex items-center gap-4 md:gap-8">
          {currentLot && lots.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
              <Gavel className="size-3 text-gold" />
              <span className="text-[10px] font-black text-white/80 tabular-nums">
                Lote {currentLot.lot_order} <span className="text-white/40">de {lots.length}</span>
              </span>
            </div>
          )}
          <div className="hidden sm:flex items-center gap-3 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
            <Users className="size-4 text-brand-400" />
            <span className="text-[10px] font-black text-white/80 tabular-nums">1.248 <span className="text-white/40 ml-1">ONLINE</span></span>
          </div>
          <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20">
            <Clock className="size-4" />
            <span className="text-sm font-black tabular-nums">{timeRemaining}s</span>
          </div>
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
            <ShieldCheck className="size-3.5 text-green-500" />
            <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Auditoria Ativa</span>
          </div>

          <Link to={`/leilao/${auctionId}`}>
            <Button variant="outline" size="sm" className="hidden md:flex bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-full h-9 px-4 gap-2">
              <LayoutGrid className="size-3.5 text-gold" />
              <span className="text-[10px] font-black uppercase tracking-widest">Ver Catálogo</span>
            </Button>
          </Link>

        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto w-full">
        <div className="flex flex-col xl:flex-row gap-6 lg:gap-10 items-start overflow-visible">
          
          <div className="w-full xl:flex-1 space-y-8 min-w-0">
            {/* Player de Vídeo com Proporção Mantida */}
            <div className="w-full aspect-video bg-black rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 relative group">
              <LivePlayer 
                url={auction?.streaming_url || undefined} 
                isStreamingActive={auction?.streaming_active ?? false}
                isPlaying={auction?.streaming_playing ?? true}
              />
            </div>

            {/* Painel do Lote - Garantindo que não seja espremido */}
            <div className="relative w-full">
               <LiveAuctionPanel 
                  auction={auction}
                  lots={lots}
                  currentLot={currentLot || undefined} 
                  isRunning={auctionControl?.is_running || false}
                  timeRemaining={timeRemaining}
                  isAdmin={isAdmin}
                  isModerator={isAdmin && isAdminMode}
                  depositStatus={depositStatus}
                  currentLeaderId={currentLeaderId}
                  transitionMessage={auctionControl?.transition_message}
                  onOpenLot={async (lotId) => {
                    if (!isAdmin || !isAdminMode) return;
                    await supabase.from('live_auction_control').update({ 
                      current_lot_id: lotId,
                      current_lot_started_at: new Date().toISOString(),
                      auctioneer_status: 'idle'
                    }).eq('auction_id', auctionId);
                  }}
                  onCloseLot={async () => {
                    if (!isAdmin || !isAdminMode || !currentLot) return;
                    
                    // 1. Get highest bid
                    const { data: bidsData } = await supabase
                      .from('bids')
                      .select('*, profiles(full_name)')
                      .eq('lot_id', currentLot.id)
                      .order('amount', { ascending: false })
                      .limit(1)
                      .maybeSingle();

                    if (bidsData) {
                      const highestBid = bidsData;
                      const bidAmount = Number(highestBid.amount);
                      
                      // 2. Calculate amounts
                      const commissionRate = auction?.commission_rate || 5.00;
                      const adminFee = auction?.administrative_fee || 0.00;
                      const commissionAmount = (bidAmount * commissionRate) / 100;
                      const finalAmount = bidAmount + commissionAmount + adminFee;

                      // 3. Create winner record
                      const { data: winnerData, error: winnerError } = await supabase.from('auction_winners').insert({
                        lot_id: currentLot.id,
                        user_id: highestBid.user_id,
                        manual_bidder_name: highestBid.manual_bidder_name,
                        bid_amount: bidAmount,
                        commission_amount: commissionAmount,
                        administrative_amount: adminFee,
                        final_amount: finalAmount,
                        escrow_status: 'pending'
                      }).select('id').single();

                      if (winnerError) {
                        console.error('Error creating winner:', winnerError);
                        toast.error('Erro ao registrar arremate');
                        return;
                      }

                      // 4. Create contract
                      await supabase.from('contracts').insert({
                        winner_id: winnerData.id,
                        status: 'active'
                      });

                      // 5. Update auction control
                      await supabase.from('live_auction_control').update({ 
                        auctioneer_status: 'sold',
                        is_running: false 
                      }).eq('auction_id', auctionId);
                      
                      // 6. Update lot status
                      await supabase.from('lots').update({ status: 'sold' }).eq('id', currentLot.id);
                      
                      const winnerName = highestBid.manual_bidder_name || (highestBid as any).profiles?.full_name || 'Licitante';
                      toast.success(`Lote Arrematado por ${winnerName}!`);
                    } else {
                      // No bids
                      await supabase.from('live_auction_control').update({ 
                        auctioneer_status: 'unsold',
                        is_running: false 
                      }).eq('auction_id', auctionId);
                      
                      await supabase.from('lots').update({ status: 'unsold' }).eq('id', currentLot.id);
                      toast.info('Lote encerrado sem lances.');
                    }
                  }}
                  onNextLot={async () => {
                    if (!isAdmin || !isAdminMode) return;
                    const nextLot = lots
                      .filter(l => l.status === 'pending' && (l.lot_order || 0) > (currentLot?.lot_order || 0))
                      .sort((a, b) => (a.lot_order || 0) - (b.lot_order || 0))[0];
                    if (nextLot) {
                      await supabase.from('live_auction_control').update({
                        current_lot_id: nextLot.id,
                        current_lot_started_at: new Date().toISOString(),
                        auctioneer_status: 'idle',
                        is_running: true,
                      }).eq('auction_id', auctionId);
                    }
                  }}
                  upcomingLots={lots
                    .filter(l => l.status === 'pending' && (l.lot_order || 0) > (currentLot?.lot_order || 0))
                    .sort((a, b) => (a.lot_order || 0) - (b.lot_order || 0))
                    .slice(0, 3)}
                  onToggleRunning={async (running) => {
                    if (!isAdmin || !isAdminMode) return;
                    await supabase.from('live_auction_control').update({ 
                      is_running: running,
                      current_lot_started_at: running ? new Date().toISOString() : auctionControl.current_lot_started_at
                    }).eq('auction_id', auctionId);
                  }}
                  onAddTime={async (seconds) => {
                    if (!isAdmin || !isAdminMode) return;
                    const newLimit = (auctionControl.lot_time_limit_seconds || 60) + seconds;
                    await supabase.from('live_auction_control').update({ lot_time_limit_seconds: newLimit }).eq('auction_id', auctionId);
                  }}
                  onManualBid={async (name, amount) => {
                    if (!isAdmin || !isAdminMode || !currentLot || !user) return;
                    const { error } = await supabase.from('bids').insert({
                      lot_id: currentLot.id,
                      amount: amount,
                      manual_bidder_name: name,
                      user_id: user.id
                    });
                    if (error) toast.error(error.message);
                    else {
                      // Update lot current bid
                      await supabase.from('lots').update({ 
                        current_highest_bid: amount
                      }).eq('id', currentLot.id);
                      
                      // Auto-restart timer if configured
                      if (auctionControl.auto_restart_timer) {
                        await supabase.from('live_auction_control').update({ 
                          current_lot_started_at: new Date().toISOString(),
                          lot_time_limit_seconds: auctionControl.lot_time_limit_seconds
                        }).eq('auction_id', auctionId);
                      }
                    }
                  }}
                  onPlaceBid={async (lotId, amount) => {
                    if (!user) {
                      toast.error('Faça login para dar lances');
                      return;
                    }
                    
                    // Check if lot is already sold
                    if (currentLot?.status === 'sold') {
                      toast.error('Este lote já foi arrematado');
                      return;
                    }
                    
                    // Admin bypass for deposit check
                    if (!isAdmin && auction?.require_deposit && depositStatus !== 'approved') {
                      setIsDepositModalOpen(true);
                      toast.info(`Sua caução de ${formatCurrency(Number(auction.deposit_amount || 0))} precisa estar aprovada.`);
                      return;
                    }
                    const { error } = await supabase.from('bids').insert({
                      lot_id: lotId,
                      user_id: user.id,
                      amount
                    });
                    if (error) toast.error(error.message);
                    else {
                       // Update lot current bid
                       await supabase.from('lots').update({ 
                         current_highest_bid: amount
                       }).eq('id', lotId);
                    }
                  }}
                  onUpdateAuction={async (data) => {
                    if (!isAdmin || !isAdminMode) return;
                    await supabase.from('auctions').update(data as any).eq('id', auctionId);
                  }}
                />
            </div>
          </div>

          <div className="w-full xl:w-[400px] space-y-6 flex flex-col xl:sticky xl:top-24 shrink-0">
            {/* Card de Status Simplificado */}
            <Card className={cn(
              "bg-white/5 border-white/10 p-6 rounded-[2rem] backdrop-blur-md transition-all duration-500",
              isAdminMode && "border-amber-500/30 bg-amber-500/5"
            )}>
               <div className="flex items-center gap-3 mb-6">
                 <div className={cn(
                   "size-10 rounded-xl flex items-center justify-center border border-white/10 shadow-xl transition-colors",
                   isAdminMode ? "bg-amber-500" : "bg-brand-800"
                 )}>
                   {isAdminMode ? <ShieldAlert className="size-5 text-black" /> : <Gavel className="size-5 text-gold" />}
                 </div>
                 <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">
                      {isAdminMode ? 'Painel de Controle' : 'Monitor de Disputa'}
                    </h3>
                    <p className="text-[9px] text-brand-400 font-bold uppercase italic">
                      {isAdminMode ? 'Administrador Ativo' : 'Auditório Online'}
                    </p>
                 </div>
               </div>
               
               <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-brand-900/40 rounded-xl border border-white/5">
                     <span className="text-[9px] font-black text-white/40 uppercase">Seu Status</span>
                     <Badge className="bg-green-600/20 text-green-500 border-none text-[9px] font-black px-2 py-0.5">
                       {isAdminMode ? 'MODERADOR' : 'HABILITADO'}
                     </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-brand-900/40 rounded-xl border border-white/5">
                     <span className="text-[9px] font-black text-white/40 uppercase">Lote Atual</span>
                     <span className="text-[10px] font-black text-white uppercase truncate max-w-[150px]">#{currentLot?.lot_order} - {currentLot?.title}</span>
                  </div>
               </div>
            </Card>

            {/* Próximos Lotes */}
            {(() => {
              const upcoming = lots
                .filter(l => l.status === 'pending' && (l.lot_order || 0) > (currentLot?.lot_order || 0))
                .sort((a, b) => (a.lot_order || 0) - (b.lot_order || 0))
                .slice(0, 4);
              if (!upcoming.length) return null;
              return (
                <Card className="bg-white/5 border-white/10 p-4 rounded-[2rem] backdrop-blur-md">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-3">Próximos Lotes</h4>
                  <div className="space-y-2">
                    {upcoming.map(lot => (
                      <div key={lot.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
                        <div className="size-6 rounded-lg bg-white/10 flex items-center justify-center text-[9px] font-black text-white shrink-0">
                          {lot.lot_order}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-white truncate">{lot.title}</p>
                          <p className="text-[8px] text-white/40 font-bold">{formatCurrency(Number(lot.starting_price))}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })()}

            {/* Auditor Virtual */}
            <div className="h-[250px] shrink-0">
               <VirtualAuditor auctionId={auctionId} lotId={currentLot?.id} />
            </div>

            {/* Histórico e Chat */}
            <div className="flex flex-col gap-6 h-[400px] xl:h-[calc(100vh-600px)] min-h-[300px] w-full">
              <div className="flex-1 min-h-0">
                <BidHistory lotId={currentLot?.id} />
              </div>
            </div>
          </div>

        </div>
        {/* Catalog Section below live player */}
        <div className="mt-12 space-y-8 pb-20">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <Gavel className="size-6 text-gold" />
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Catálogo Completo</h2>
            </div>
            <Badge className="bg-brand-900 text-brand-400 border border-brand-800 px-4 py-1 rounded-full font-black">
              {lots.length} LOTES
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {lots.map(lot => (
              <Card key={lot.id} className="bg-brand-900/40 border border-brand-800 overflow-hidden hover:border-gold/50 transition-all group rounded-2xl">
                <Link to={`/lote/${lot.id}`} className="block">
                  <div className="relative aspect-square overflow-hidden bg-black">
                    <SmartImage src={lot.image_url || "/placeholder.svg"} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-3 left-3 bg-gold text-black px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                      LOTE {lot.lot_order}
                    </div>
                    {lot.status === 'sold' && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <span className="text-white font-black text-xs uppercase border border-white/30 px-3 py-1 rounded-lg transform -rotate-6">ARREMATADO</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <h3 className="text-xs font-black text-white group-hover:text-gold transition-colors truncate uppercase">{lot.title}</h3>
                    <div className="flex justify-between items-center border-t border-white/5 pt-3">
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-brand-500 uppercase tracking-widest">Lance Atual</p>
                        <p className="text-sm font-black text-white tabular-nums">{formatCurrency(Number(lot.current_highest_bid || lot.starting_price || 0))}</p>
                      </div>
                      <div className="size-8 rounded-full bg-brand-800 text-brand-400 flex items-center justify-center group-hover:bg-gold group-hover:text-black transition-all">
                        <Maximize2 className="size-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </main>
      
      <SiteFooter />
      <div className="h-10 shrink-0" />
      
      <DepositModal 
        isOpen={isDepositModalOpen} 
        onClose={() => setIsDepositModalOpen(false)} 
        requiredAmount={auction?.deposit_amount || 0}
        auctionId={auctionId}
      />
    </div>
  );
}
