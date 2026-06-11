import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  TrendingUp, 
  Gavel, 
  ShieldCheck, 
  ArrowLeft, 
  Share2, 
  Maximize2,
  AlertTriangle,
  Trophy
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn, formatCurrency, formatNumberBR, maskCurrency, parseBRNumber } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { BidRanking } from './BidRanking';
import { SkeletonPremium } from '@/components/ui/skeleton-premium';
import { Lot, Bid, Auction } from '@/types/auction';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { FavoriteButton } from './FavoriteButton';
import { SmartImage } from '../SmartImage';
import { SEO } from '../SEO';
import { BidConfirmDialog } from './BidConfirmDialog';
import { BID_ERRORS } from '@/lib/bid-errors';

interface LotPageProps {
  lotId: string;
}

export function LotPage({ lotId }: LotPageProps) {
  const { user } = useAuth();
  const [lot, setLot] = useState<Lot | null>(null);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [depositStatus, setDepositStatus] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lightboxData, setLightboxData] = useState<{ open: boolean; index: number; images: string[] }>({
    open: false,
    index: 0,
    images: [],
  });
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingBid, setPendingBid] = useState<{ amount: number; isBuyout?: boolean } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: lotData, error: lotError } = await supabase
          .from('lots')
          .select('*, auction:auctions(*)')
          .eq('id', lotId)
          .single();

        if (lotError) throw lotError;
        setLot(lotData);
        setAuction(lotData.auction as unknown as Auction);

        const { data: bidsData } = await supabase
          .from('bids')
          .select('*, profiles:profiles_public(full_name, avatar_url)')
          .eq('lot_id', lotId)
          .order('created_at', { ascending: false });

        setBids((bidsData as any[]) || []);

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          setIsAdmin(profile?.role === 'admin');

          if (lotData.auction_id) {
            const { data: deposit } = await supabase
              .from('caucao')
              .select('status')
              .eq('user_id', user.id)
              .eq('auction_id', lotData.auction_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            setDepositStatus(deposit?.status || null);
          }
        }
      } catch (err) {
        toast.error('Erro ao carregar dados do lote');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const channel = supabase
      .channel(`lot-detail:${lotId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids', filter: `lot_id=eq.${lotId}` },
        (payload) => {
          const newBid = payload.new as Bid;
          
          // Add bid immediately
          setBids(prev => {
            if (prev.some(b => b.id === newBid.id)) return prev;
            return [newBid as any, ...prev].sort((a, b) => b.amount - a.amount);
          });

          // Fetch profile in background
          supabase
            .from('profiles_public')
            .select('full_name, avatar_url')
            .eq('id', newBid.user_id)
            .single()
            .then(({ data: profile }) => {
              if (profile) {
                setBids(prev => prev.map(b => 
                  b.id === newBid.id ? { ...b, profiles: profile } : b
                ));
              }
            });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'lots', filter: `id=eq.${lotId}` },
        (payload) => {
          setLot(prev => ({ ...prev, ...(payload.new as Lot) }));
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [lotId, user]);

  useEffect(() => {
    if (!lot) return;
    const timer = setInterval(() => {
      const now = new Date();
      const startTime = auction?.starts_at ? new Date(auction.starts_at).getTime() : 0;
      const endTime = lot.active_until ? new Date(lot.active_until).getTime() : 
                        auction?.ends_at ? new Date(auction.ends_at).getTime() : 0;
      
      if (now.getTime() < startTime) {
        const remaining = Math.max(0, Math.floor((startTime - now.getTime()) / 1000));
        setTimeLeft(remaining);
      } else {
        const remaining = Math.max(0, Math.floor((endTime - now.getTime()) / 1000));
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lot, auction]);

  const handlePlaceBid = async () => {
    if (!user) {
      toast.error(BID_ERRORS.NOT_LOGGED_IN);
      return;
    }
    if (auction?.starts_at && new Date(auction.starts_at) > new Date()) {
      toast.error(BID_ERRORS.AUCTION_NOT_STARTED);
      return;
    }
    if (auction?.ends_at && new Date(auction.ends_at) < new Date()) {
      toast.error(BID_ERRORS.AUCTION_CLOSED);
      return;
    }
    if (!isAdmin && auction?.require_deposit && depositStatus !== 'approved') {
      toast.error(BID_ERRORS.DEPOSIT_REQUIRED);
      return;
    }

    const amount = parseBRNumber(bidAmount);
    const currentPrice = Number(lot?.current_highest_bid || lot?.starting_price || 0);
    const minIncrement = Number(lot?.min_increment || 100);
    
    if (!bidAmount || isNaN(amount) || amount < currentPrice + minIncrement) {
      toast.error(BID_ERRORS.LOW_BID(formatCurrency(currentPrice + minIncrement)));
      return;
    }

    setPendingBid({ amount });
  };

  const executeBid = async (amount: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Race condition block: check latest value
      const { data: latestLot, error: fetchError } = await supabase
        .from('lots')
        .select('current_highest_bid, starting_price, min_increment')
        .eq('id', lotId)
        .single();

      if (fetchError) throw fetchError;

      const currentPrice = Number(latestLot.current_highest_bid || latestLot.starting_price || 0);
      const minIncrement = Number(latestLot.min_increment || 100);

      if (amount < currentPrice + minIncrement) {
        toast.error(BID_ERRORS.RACE_CONDITION);
        setLot(prev => prev ? { ...prev, current_highest_bid: currentPrice } : null);
        return;
      }

      // Optimistic Update
      const tempBidId = crypto.randomUUID();
      const optimisticBid: Bid = {
        id: tempBidId,
        lot_id: lotId,
        user_id: user!.id,
        amount,
        is_automatic: false,
        created_at: new Date().toISOString(),
        bid_source: 'web',
        profiles: {
          full_name: (user as any).user_metadata?.full_name || 'Você',
          avatar_url: (user as any).user_metadata?.avatar_url || null
        }
      };

      setBids(prev => [optimisticBid, ...prev].sort((a, b) => b.amount - a.amount));
      setLot(prev => {
        if (prev && amount > Number(prev.current_highest_bid || prev.starting_price || 0)) {
          return { ...prev, current_highest_bid: amount };
        }
        return prev;
      });

      const { error } = await supabase.from('bids').insert({
        lot_id: lotId,
        user_id: user!.id,
        amount,
        bid_source: 'web'
      });
      
      if (error) {
        // Rollback
        setBids(prev => prev.filter(b => b.id !== tempBidId));
        toast.error(error.message || BID_ERRORS.PROCESS_ERROR);
      } else {
        toast.success('LANCE CONFIRMADO!');
        setBidAmount('');
      }
    } catch (err: any) {
      toast.error(err.message || BID_ERRORS.GENERIC_ERROR);
    } finally {
      setIsSubmitting(false);
      setPendingBid(null);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return 'Encerrado';
    const isUpcoming = auction?.starts_at && new Date(auction.starts_at) > new Date();
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return isUpcoming ? `Abre em ${hours > 0 ? hours + 'h ' : ''}${minutes}m ${secs}s` : `${hours > 0 ? hours + 'h ' : ''}${minutes}m ${secs}s`;
  };

  const handleBuyout = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para arrematar este lote');
      return;
    }
    if (!lot?.buyout_price) return;
    setPendingBid({ amount: Number(lot.buyout_price), isBuyout: true });
  };

  const executeBuyout = async (buyoutAmt: number) => {
    if (!user || !lot) return;
    try {
      const commissionRate = auction?.commission_rate || 5.00;
      const adminFee = Number(auction?.administrative_fee || 0);
      const commAmt = (buyoutAmt * commissionRate) / 100;
      const totalAmt = buyoutAmt + commAmt + adminFee;
      const { data: winnerData, error: winnerError } = await supabase.from('auction_winners').insert({
        lot_id: lotId,
        user_id: user.id,
        bid_amount: buyoutAmt,
        commission_amount: commAmt,
        administrative_amount: adminFee,
        final_amount: totalAmt,
        escrow_status: 'pending'
      }).select('id').single();
      if (!winnerError && winnerData) {
        await supabase.from('contracts').insert({ winner_id: winnerData.id, status: 'active' });
      }
      if (winnerError) throw winnerError;
      await supabase.from('lots').update({ status: 'sold' }).eq('id', lotId);
      toast.success('PARABÉNS! Você arrematou o lote com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao processar arremate antecipado: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-20 pt-32">
        <SkeletonPremium className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <SkeletonPremium className="lg:col-span-7 aspect-square rounded-[2rem]" />
          <div className="lg:col-span-5 space-y-6">
            <SkeletonPremium className="h-12 w-full" />
            <SkeletonPremium className="h-32 w-full" />
            <SkeletonPremium className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!lot) return <div className="text-white p-20">Lote não encontrado.</div>;

  const images = [
    ...(lot.image_url ? [lot.image_url] : []),
    ...(lot.gallery_urls || [])
  ].filter((url, index, self) => self.indexOf(url) === index);

  const currentPrice = Number(lot.current_highest_bid || lot.starting_price || 0);
  const increment = Number(lot.min_increment || 100);
  const nextMinBid = currentPrice + increment;
  const commissionRate = auction?.commission_rate || 5.00;
  const adminFee = Number(auction?.administrative_fee || 0);
  const commissionAmount = (currentPrice * commissionRate) / 100;
  const finalTotal = currentPrice + commissionAmount + adminFee;
  const isLotActive = lot.status === 'active';

  return (
    <div className="min-h-screen bg-brand-950 max-w-full pb-20 pt-20 lg:pt-32">
      <SEO 
        title={lot.title} 
        description={lot.description || undefined} 
        image={lot.image_url || undefined} 
        type="product"
        breadcrumbs={[
          { name: 'Início', item: '/' },
          { name: 'Leilões', item: '/' },
          { name: auction?.title || 'Leilão', item: `/leilao/${lot.auction_id}` },
          { name: lot.title, item: `/lote/${lotId}` }
        ]}
      />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 space-y-8 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <Link to={`/leilao/${lot.auction_id}`} className="flex items-center gap-2 text-brand-400 hover:text-white transition-colors group">
            <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-black uppercase tracking-widest text-xs">Voltar ao Leilão</span>
          </Link>
          <div className="flex items-center gap-2">
            <FavoriteButton lotId={lot.id} size="default" variant="ghost" className="bg-brand-900/50 hover:bg-brand-800" />
            <Button variant="ghost" size="icon" className="text-brand-400 hover:text-white rounded-full bg-brand-900/50 hover:bg-brand-800"><Share2 className="size-5" /></Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="relative aspect-square bg-black rounded-[2.5rem] overflow-hidden border border-brand-800 flex items-center justify-center cursor-zoom-in group" onClick={() => setLightboxData({ open: true, index: 0, images })}>
              <SmartImage src={lot.image_url || ""} alt={lot.title} className="w-full h-full object-contain" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Maximize2 className="size-10 text-white" /></div>
              
              <AnimatePresence>
                {lot.status === 'sold' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
                  >
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-gold/40 blur-[40px] rounded-full animate-pulse" />
                      <Trophy className="size-20 text-gold relative z-10 animate-bounce-slow" />
                    </div>
                    <h2 className="text-5xl font-black text-gold drop-shadow-glow-gold tracking-tighter italic uppercase">VENDIDO!</h2>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="absolute top-6 left-6 z-10"><span className="bg-gold text-black px-4 py-2 rounded-xl font-black uppercase tracking-widest">Lote {lot.lot_order || '00'}</span></div>
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-6 gap-4">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setLightboxData({ open: true, index: idx, images })} className="aspect-square bg-brand-900 rounded-2xl overflow-hidden border border-brand-800 hover:border-gold transition-colors">
                    <SmartImage src={img} className="w-full h-full object-cover" fallbackAlt={`${lot.title} - imagem ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}

            <div className="bg-brand-900/40 backdrop-blur-md rounded-[2rem] p-8 border border-brand-800 space-y-4">
              <h2 className="card-title text-xl text-white">Descrição do Lote</h2>
              <div className="text-white/80 leading-relaxed whitespace-pre-wrap">{lot.description || "Sem descrição."}</div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-brand-900/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-brand-800 shadow-2xl space-y-8">
              <div className="space-y-2">
                <p className="text-brand-400 font-black uppercase tracking-widest text-[10px]">Leilão {auction?.title}</p>
                <h1 className="section-title text-3xl md:text-4xl text-white leading-tight break-words">{lot.title}</h1>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-800 border border-brand-700">
                  <Clock className="size-3.5 text-gold" />
                  <span className="text-xs font-black tabular-nums">{formatTime(timeLeft)}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-800 border border-brand-700">
                  <TrendingUp className="size-3.5 text-green-500" />
                  <span className="text-xs font-black text-white">{bids.length} Lances</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-brand-950/60 p-5 rounded-3xl border border-brand-800/50">
                  <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-1">Lance Atual</p>
                  <p className="text-3xl font-black text-white tracking-tighter tabular-nums">{formatCurrency(currentPrice)}</p>
                </div>
                <div className="bg-brand-950/60 p-5 rounded-3xl border border-brand-800/50">
                  <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-1">Incremento</p>
                  <p className="text-xl font-black text-gold tracking-tighter tabular-nums">{formatCurrency(increment)}</p>
                </div>
              </div>

              <div className="bg-brand-950/40 p-6 rounded-3xl border border-brand-800/50 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-brand-800/50">
                  <span className="text-[10px] font-black text-brand-400 uppercase tracking-widest">Resumo do Arremate</span>
                  <span className="text-[10px] font-black text-gold uppercase tracking-widest">Taxa: {commissionRate}%</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-brand-400">Lance Atual</span>
                    <span className="text-white font-black">{formatCurrency(currentPrice)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-brand-400">Comissão ({commissionRate}%)</span>
                    <span className="text-white font-black">{formatCurrency(commissionAmount)}</span>
                  </div>
                  {adminFee > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-brand-400">Taxa Administrativa</span>
                      <span className="text-white font-black">{formatCurrency(adminFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-brand-800/50">
                    <span className="text-gold font-black uppercase text-[10px] tracking-widest">Total Estimado</span>
                    <span className="text-xl font-black text-white tabular-nums tracking-tighter">{formatCurrency(finalTotal)}</span>
                  </div>
                </div>
              </div>

              {!isLotActive ? (
                <div className={cn(
                  "flex items-center justify-center gap-4 p-8 rounded-3xl border",
                  lot.status === 'sold'
                    ? "bg-gold/10 border-gold/30"
                    : "bg-brand-800/30 border-brand-700/30"
                )}>
                  <Gavel className={cn("size-7", lot.status === 'sold' ? "text-gold" : "text-brand-500")} />
                  <p className={cn("font-black text-xl uppercase tracking-widest", lot.status === 'sold' ? "text-gold" : "text-brand-400")}>
                    {lot.status === 'sold' ? 'LOTE ARREMATADO' : lot.status === 'pending' ? 'AGUARDANDO ABERTURA' : 'ENCERRADO SEM LANCES'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" className="h-12 border-brand-800" onClick={() => setBidAmount(formatNumberBR(nextMinBid))}>+ {formatCurrency(increment)}</Button>
                    <Button variant="outline" className="h-12 border-brand-800" onClick={() => setBidAmount(formatNumberBR(nextMinBid + increment))}>+ {formatCurrency(increment * 2)}</Button>
                    <Button variant="outline" className="h-12 border-brand-800" onClick={() => setBidAmount(formatNumberBR(nextMinBid + increment * 5))}>+ {formatCurrency(increment * 6)}</Button>
                  </div>

                  {lot.buyout_enabled && lot.buyout_price && lot.buyout_price > 0 && (
                    <Button
                      variant="secondary"
                      className="w-full h-14 rounded-2xl border-white/10"
                      onClick={handleBuyout}
                    >
                      <Gavel className="size-5 mr-3 text-gold" /> Arrematar Agora: {formatCurrency(Number(lot.buyout_price))}
                    </Button>
                  )}

                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500 font-black">R$</span>
                      <Input
                        type="text"
                        placeholder={`Mínimo ${formatCurrency(nextMinBid)}`}
                        className="h-16 pl-12 bg-brand-950 border-brand-800 text-white font-black text-lg rounded-2xl"
                        value={bidAmount}
                        onChange={(e) => {
                          setBidAmount(maskCurrency(e.target.value));
                        }}
                      />
                    </div>
                    <Button className="h-16 px-8 rounded-2xl" onClick={handlePlaceBid}>DAR LANCE</Button>
                  </div>

                  {auction?.require_deposit && depositStatus !== 'approved' && !isAdmin && (
                    <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
                      <AlertTriangle className="size-5 shrink-0" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Exige caução aprovada para dar lances.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-black text-brand-500 uppercase tracking-widest flex items-center gap-2"><TrendingUp className="size-4" /> Histórico de Lances</h3>
              <div className="h-[400px]"><BidRanking lot={lot} bids={bids} currentUserId={user?.id} /></div>
            </div>
          </div>
        </div>
      </div>
      <ImageLightbox open={lightboxData.open} close={() => setLightboxData({ ...lightboxData, open: false })} images={lightboxData.images} index={lightboxData.index} />
      <BidConfirmDialog
        isOpen={!!pendingBid}
        onClose={() => setPendingBid(null)}
        onConfirm={() => {
          if (pendingBid) {
            if (pendingBid.isBuyout) {
              executeBuyout(pendingBid.amount);
            } else {
              executeBid(pendingBid.amount);
            }
          }
        }}
        amount={pendingBid?.amount || 0}
        lotTitle={lot.title}
        title={pendingBid?.isBuyout ? "Confirmar Arremate" : "Confirmar Lance"}
        description={pendingBid?.isBuyout ? `Deseja realmente arrematar este lote agora pelo valor de ${formatCurrency(pendingBid.amount)}?` : undefined}
      />
    </div>
  );
}