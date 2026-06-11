import { useEffect, useState, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, TrendingUp, Users, Maximize2, Gavel, ShieldCheck, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatCurrency, formatNumberBR, maskCurrency, parseBRNumber } from '@/lib/utils';
import type { Lot } from '@/types/auction';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { SkeletonPremium } from '@/components/ui/skeleton-premium';
import { FavoriteButton } from './FavoriteButton';
import { SmartImage } from '../SmartImage';

interface SimultaneousAuctionGridProps {
  auction: any;
  lots: Lot[];
  onPlaceBid: (lotId: string, amount: number) => Promise<void>;
  onCloseLot?: (lotId: string) => Promise<void>;
  onBuyout?: (lotId: string) => Promise<void>;
  onToggleHammer?: (lotId: string, enabled: boolean) => Promise<void>;
  onUserHammer?: (lotId: string) => Promise<void>;
  userBids?: Record<string, number>;
  isLoading?: boolean;
  depositStatus?: string | null;
  isAdmin?: boolean;
}

export function SimultaneousAuctionGrid({
  auction,
  lots,
  onPlaceBid,
  onCloseLot,
  onBuyout,
  onToggleHammer,
  onUserHammer,
  userBids = {},
  isLoading = false,
  depositStatus = null,
  isAdmin = false,
}: SimultaneousAuctionGridProps) {
  const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({});
  const [submittingLots, setSubmittingLots] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});
  const [lightboxData, setLightboxData] = useState<{ open: boolean; index: number; images: string[] }>({
    open: false,
    index: 0,
    images: [],
  });

  // Calculate time remaining for each lot
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const newTimeRemaining: Record<string, number> = {};

      lots.forEach(lot => {
        const startTime = auction?.starts_at ? new Date(auction.starts_at).getTime() : 0;
        
        if (now < startTime) {
          // Countdown to start
          newTimeRemaining[lot.id] = Math.max(0, Math.floor((startTime - now) / 1000));
        } else if (lot.active_until) {
          const endTime = new Date(lot.active_until).getTime();
          newTimeRemaining[lot.id] = Math.max(0, Math.floor((endTime - now) / 1000));
        } else if (auction.ends_at) {
          const endTime = new Date(auction.ends_at).getTime();
          newTimeRemaining[lot.id] = Math.max(0, Math.floor((endTime - now) / 1000));
        }
      });

      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [lots, auction.ends_at]);

  const handleBidChange = (lotId: string, value: string) => {
    setBidAmounts(prev => ({
      ...prev,
      [lotId]: maskCurrency(value),
    }));
  };

  const handlePlaceBidWithConfirm = useCallback(
    async (lotId: string, amount: number) => {
      const lot = lots.find(l => l.id === lotId);
      if (!lot) return;
      
      const currentBid = Number(lot.current_highest_bid || lot.starting_price || 0);
      const minIncrement = Number(lot.min_increment || 100);

      if (!amount || amount < currentBid + minIncrement) {
        toast.error(`Lance deve ser de pelo menos ${formatCurrency(currentBid + minIncrement)}`);
        return;
      }

      setSubmittingLots(prev => new Set([...prev, lotId]));
      
      // Virtual Auditor Simulation
      const toastId = toast.loading(`Auditor Virtual: Validando lance para o Lote ${lot.lot_order}...`, {
        icon: <ShieldCheck className="size-4 text-green-500 animate-pulse" />,
      });

      try {
        await onPlaceBid(lotId, amount);
        
        toast.success(`Auditor Virtual: Lance verificado e aceito com sucesso!`, {
          id: toastId,
          duration: 2000
        });

        setBidAmounts(prev => ({
          ...prev,
          [lotId]: '',
        }));
      } catch (error) {
        console.error('Erro ao fazer lance:', error);
        toast.error(`Auditor Virtual: Falha na validação do lance.`, { id: toastId });
      } finally {
        setSubmittingLots(prev => {
          const newSet = new Set(prev);
          newSet.delete(lotId);
          return newSet;
        });
      }
    },
    [lots, onPlaceBid]
  );

  const handleManualPlaceBid = useCallback(
    async (lotId: string) => {
      const amount = parseBRNumber(bidAmounts[lotId] || '0');
      await handlePlaceBidWithConfirm(lotId, amount);
    },
    [bidAmounts, handlePlaceBidWithConfirm]
  );

  const formatTime = (seconds: number, startsAt?: string) => {
    if (seconds <= 0) return 'Encerrado';
    
    const isUpcoming = startsAt && new Date(startsAt) > new Date();
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    let timeStr = '';
    if (hours > 0) timeStr = `${hours}h ${minutes}m`;
    else if (minutes > 0) timeStr = `${minutes}m ${secs}s`;
    else timeStr = `${secs}s`;
    
    return isUpcoming ? `Inicia em ${timeStr}` : timeStr;
  };

  const getTimeStatusColor = (seconds: number) => {
    if (seconds <= 60) return 'text-red-500';
    if (seconds <= 300) return 'text-orange-500';
    return 'text-green-500';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonPremium className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="space-y-4">
              <SkeletonPremium className="h-64 w-full rounded-2xl" />
              <div className="space-y-2">
                <SkeletonPremium className="h-6 w-3/4" />
                <SkeletonPremium className="h-20 w-full" />
                <div className="grid grid-cols-2 gap-2">
                  <SkeletonPremium className="h-10 w-full" />
                  <SkeletonPremium className="h-10 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {lots.length === 0 ? (
        <div className="text-center py-32 px-6 bg-brand-900/20 rounded-[4rem] border-2 border-dashed border-brand-800/50 space-y-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-950/40 pointer-events-none" />
          <div className="relative z-10 space-y-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gold/10 blur-2xl rounded-full" />
              <div className="size-24 bg-brand-900 rounded-[2rem] border border-brand-800 flex items-center justify-center mx-auto shadow-2xl transition-all group-hover:border-gold/30">
                <Gavel className="size-10 text-brand-700" />
              </div>
            </div>
            <div className="space-y-3 max-w-md mx-auto">
              <h2 className="text-3xl section-title text-white">Aguardando Lotes</h2>
              <p className="text-brand-400 font-medium leading-relaxed italic">
                Este evento simultâneo ainda não possui lotes cadastrados. Fique atento às atualizações do organizador.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Auction Info */}
      <div className="bg-brand-900 border border-brand-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Gavel className="size-32" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <span className="bg-gold text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-glow-gold">Evento Exclusivo</span>
            {new Date(auction.starts_at) > new Date() && (
              <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">Aguardando Abertura</span>
            )}
          </div>
          <h2 className="text-3xl md:text-5xl section-title text-white tracking-tighter">{auction.title}</h2>
          <div className="flex flex-wrap items-center gap-6 text-sm text-brand-300 font-medium">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold" />
              <span>Início: {new Date(auction.starts_at).toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-500" />
              <span>Término: {new Date(auction.ends_at).toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span>Auditoria Virtual Ativa</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {lots.map(lot => {
          const remaining = timeRemaining[lot.id] || 0;
          const isEnded = remaining <= 0 || lot.status === 'sold';
          const currentBid = Number(lot.current_highest_bid || lot.starting_price || 0);
          const increment = Number(lot.min_increment || 100);
          const nextMinBid = currentBid + increment;

          return (
            <Card
              key={lot.id}
              className={cn(
                "group overflow-hidden transition-all duration-500 border-[6px] bg-brand-950 shadow-2xl relative",
                !isEnded 
                  ? "border-brand-800 hover:border-gold hover:shadow-[0_0_60px_rgba(212,175,55,0.3)] hover:scale-[1.03] z-10" 
                  : "border-brand-900 opacity-50 grayscale",
              )}
            >
              <Link to={`/lote/${lot.id}`} className="absolute inset-0 z-[5] cursor-pointer" />
              
              {/* Image Section */}
              <div 
                className="relative h-64 bg-black overflow-hidden flex items-center justify-center cursor-zoom-in group z-10"
                onClick={(e) => {
                  e.preventDefault();
                  if (lot.image_url) {
                    setLightboxData({
                      open: true,
                      index: 0,
                      images: [
                        ...(lot.image_url ? [lot.image_url] : []),
                        ...(lot.gallery_urls || [])
                      ].filter((url, index, self) => self.indexOf(url) === index),
                    });
                  }
                }}
              >
                {lot.image_url ? (
                  <>
                    <SmartImage
                      src={lot.image_url}
                      alt={lot.title}
                      className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="size-8 text-white drop-shadow-lg" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-brand-800">
                    <TrendingUp className="size-12 opacity-20" />
                    <span className="text-[10px] font-black uppercase">Sem imagem</span>
                  </div>
                )}
                
                <div className="absolute top-3 left-3">
                  <span className="bg-gold text-black text-[10px] font-black px-3 py-1.5 rounded-xl tracking-widest uppercase shadow-2xl">
                    LOTE {lot.lot_order || '00'}
                  </span>
                </div>

                {isEnded && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-20 p-6">
                    <div className="relative text-center space-y-4">
                      <div className="absolute inset-0 bg-gold/20 blur-[40px] rounded-full animate-pulse" />
                      <div className="relative z-10">
                        <Trophy className={cn("size-16 mx-auto mb-2 drop-shadow-glow-gold", lot.status === 'sold' ? "text-gold animate-bounce-slow" : "text-brand-700")} />
                        <span className={cn(
                          "block font-black text-3xl md:text-4xl tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(234,179,8,0.4)] transform -rotate-2",
                          lot.status === 'sold' ? "text-gold" : "text-brand-400"
                        )}>
                          {lot.status === 'sold' ? 'ARREMATADO' : 'ENCERRADO'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className={cn(
                  "absolute bottom-4 right-4 px-3 py-1.5 rounded-lg font-black tabular-nums text-[10px] border backdrop-blur-md shadow-2xl z-20",
                  new Date(auction.starts_at) > new Date() 
                    ? "bg-blue-600/20 text-blue-400 border-blue-600/50"
                    : getTimeStatusColor(remaining).replace('text-', 'bg-').replace('-500', '-500/20') + " " + getTimeStatusColor(remaining) + " border-current"
                )}>
                  {formatTime(remaining, auction.starts_at)}
                </div>
              </div>

              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="card-title text-base text-brand-50 line-clamp-2 h-10 leading-tight flex-1 drop-shadow-sm">
                    {lot.title}
                  </h3>
                  <div className="flex items-center gap-1">
                    <FavoriteButton lotId={lot.id} size="sm" variant="ghost" />
                    <Button variant="ghost" size="icon" className="shrink-0 text-brand-400 hover:text-gold rounded-full" asChild>
                      <Link to={`/lote/${lot.id}`}>
                        <Maximize2 className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end bg-brand-900/40 p-3 rounded-2xl border border-brand-800/50">
                    <div>
                      <p className="text-[9px] font-black text-gold uppercase tracking-widest">Lance Atual</p>
                      <p className="text-2xl font-black text-white mt-1 tabular-nums tracking-tighter">
                        {formatCurrency(currentBid)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-gold uppercase tracking-widest">Incr.</p>
                      <p className="text-xs font-black text-brand-100">{formatCurrency(increment)}</p>
                    </div>
                  </div>


                  {!isEnded && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-10 bg-brand-800 hover:bg-brand-700 text-brand-100 font-black uppercase tracking-tighter rounded-xl border-none"
                          onClick={() => handleBidChange(lot.id, formatNumberBR(nextMinBid))}
                          disabled={isLoading || (!isAdmin && auction?.require_deposit && depositStatus !== 'approved')}
                        >
                          + {formatCurrency(increment)}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-10 bg-brand-800 hover:bg-brand-700 text-brand-100 font-black uppercase tracking-tighter rounded-xl border-none"
                          onClick={() => handleBidChange(lot.id, formatNumberBR(nextMinBid + increment))}
                          disabled={isLoading || (!isAdmin && auction?.require_deposit && depositStatus !== 'approved')}
                        >
                          + {formatCurrency(increment * 2)}
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500 font-black text-xs">R$</span>
                          <Input
                            type="text"
                            placeholder={formatNumberBR(nextMinBid)}
                            value={bidAmounts[lot.id] || ''}
                            onChange={e => handleBidChange(lot.id, e.target.value)}
                            disabled={submittingLots.has(lot.id) || isLoading || (!isAdmin && auction?.require_deposit && depositStatus !== 'approved')}
                            className="bg-brand-900/50 border-brand-800 h-12 pl-9 rounded-xl font-black text-white focus:ring-gold/50"
                          />
                        </div>
                        <Button
                          className={cn(
                            "h-12 px-6 font-black uppercase tracking-widest rounded-xl transition-all",
                            (isAdmin || auction?.require_deposit === false || depositStatus === 'approved') 
                              ? "bg-gold text-black hover:bg-gold-light shadow-glow-gold" 
                              : "bg-brand-800 text-brand-600 cursor-not-allowed"
                          )}
                          onClick={() => handleManualPlaceBid(lot.id)}
                          disabled={submittingLots.has(lot.id) || isLoading || !bidAmounts[lot.id] || (!isAdmin && auction?.require_deposit && depositStatus !== 'approved')}
                        >
                          {submittingLots.has(lot.id) ? (
                            <div className="size-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                          ) : (
                            'OFERTAR'
                          )}
                        </Button>
                      </div>

                      {isAdmin && !isEnded && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full h-10 border-brand-700 text-brand-400 hover:text-red-500 hover:border-red-500/50 bg-transparent transition-all"
                          onClick={() => onCloseLot?.(lot.id)}
                        >
                          ENCERRAR LOTE AGORA (ADMIN)
                        </Button>
                      )}

                      {auction?.require_deposit && depositStatus !== 'approved' && !isAdmin && (
                        <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-xl">
                          <p className="text-[9px] text-red-500 font-black uppercase text-center tracking-[0.1em]">
                            Exige caução aprovada para dar lances
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {userBids[lot.id] && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Seu melhor lance</p>
                        <p className="text-xl font-black text-blue-300 tabular-nums tracking-tighter">
                          R$ {userBids[lot.id].toLocaleString('pt-BR')}
                        </p>
                      </div>
                      {userBids[lot.id] >= currentBid ? (
                        <div className="bg-blue-500 text-[8px] font-black text-white px-2 py-0.5 rounded-full animate-pulse">LIDERANDO</div>
                      ) : (
                        <div className="text-[8px] font-black text-brand-300 uppercase tracking-widest">SUPERADO</div>
                      )}
                    </div>
                  )}

                  {lot.buyout_enabled && lot.buyout_price && lot.buyout_price > 0 && !isEnded && (
                    <Button
                      className="w-full h-12 text-xs font-black uppercase tracking-widest bg-white text-brand-950 hover:bg-white/90 rounded-2xl shadow-xl transition-all duration-300 border-none mb-2"
                      onClick={() => onBuyout?.(lot.id)}
                      disabled={isLoading || (auction?.require_deposit && depositStatus !== 'approved')}
                    >
                      <Gavel className="size-4 mr-2" />
                      Arremate Antecipado (R$ {Number(lot.buyout_price).toLocaleString('pt-BR')})
                    </Button>
                  )}
                  <Button 
                    className={cn(
                      "w-full h-12 text-xs font-black uppercase tracking-[0.15em] rounded-2xl shadow-glow-gold transition-all duration-300 mt-2 border-none group/btn",
                      isEnded ? "bg-brand-800 text-brand-500" : "bg-gold text-black hover:bg-gold-light hover:scale-[1.02]"
                    )}
                    asChild
                  >
                    <Link to={`/lote/${lot.id}`} className="flex items-center justify-center w-full h-full">
                      {isEnded ? 'Ver Detalhes' : 'Acessar página de lance'}
                      {!isEnded && <Gavel className="ml-2 size-4 transition-transform group-hover/btn:rotate-[-10deg]" />}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ImageLightbox
        open={lightboxData.open}
        close={() => setLightboxData({ ...lightboxData, open: false })}
        images={lightboxData.images}
        index={lightboxData.index}
      />
    </>
    )}
  </div>
);
}
