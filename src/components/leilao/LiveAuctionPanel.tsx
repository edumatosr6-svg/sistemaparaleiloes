import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, ChevronRight, ChevronLeft, Clock, Gavel, ShieldAlert, AlertTriangle, Maximize2, Mic, Phone, ExternalLink, Trophy } from 'lucide-react';
import { BidConfirmDialog } from './BidConfirmDialog';
import type { Lot } from '@/types/auction';
import { cn, formatCurrency, formatNumberBR, maskCurrency, parseBRNumber } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import useEmblaCarousel from 'embla-carousel-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SmartImage } from '../SmartImage';

interface LiveAuctionControlProps {
  auction: any;
  lots: Lot[];
  currentLot?: Lot;
  isRunning: boolean;
  timeRemaining: number;
  onOpenLot: (lotId: string) => void;
  onCloseLot: () => void;
  onNextLot: () => void;
  onToggleRunning: (running: boolean) => void;
  onSecurityBid?: () => void;
  onPlaceBid?: (lotId: string, amount: number) => Promise<void>;
  depositStatus?: string | null;
  isAdmin?: boolean;
  isModerator?: boolean;
  currentLeaderId?: string | null;
  bidCount?: number;
  onBuyout?: (lotId: string) => Promise<void>;
  onToggleHammer?: (lotId: string, enabled: boolean) => Promise<void>;
  onUserHammer?: (lotId: string) => Promise<void>;
  onUpdateAuction?: (data: Partial<any>) => Promise<void>;
  onAddTime?: (seconds: number) => void;
  onManualBid?: (name: string, amount: number) => Promise<void>;
  transitionMessage?: string | null;
  upcomingLots?: Lot[];
}

export function LiveAuctionPanel({
  auction,
  lots,
  currentLot,
  isRunning,
  timeRemaining,
  onOpenLot,
  onCloseLot,
  onNextLot,
  onToggleRunning,
  onSecurityBid,
  onPlaceBid,
  depositStatus = null,
  isAdmin = false,
  isModerator = false,
  currentLeaderId = null,
  bidCount = 0,
  onBuyout,
  onToggleHammer,
  onUserHammer,
  onUpdateAuction,
  onAddTime,
  onManualBid,
  transitionMessage,
  upcomingLots = [],
}: LiveAuctionControlProps) {
  const [displayTime, setDisplayTime] = useState(timeRemaining);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTalking, setIsTalking] = useState(false);
  const [narrationLink, setNarrationLink] = useState(auction?.streaming_url || '');
  const [manualBidName, setManualBidName] = useState('');
  const [manualBidAmount, setManualBidAmount] = useState('');
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [adminPendingAction, setAdminPendingAction] = useState<{ type: 'manual_sell' | 'hammer'; amount?: number; name?: string } | null>(null);

  useEffect(() => {
    if (currentLot?.status === 'sold') {
      const fetchWinner = async () => {
        const { data, error } = await supabase
          .from('auction_winners')
          .select('manual_bidder_name, profiles(full_name)')
          .eq('lot_id', currentLot.id)
          .maybeSingle();
        
        if (data) {
          const name = data.manual_bidder_name || (data as any).profiles?.full_name || 'Licitante';
          setWinnerName(name);
        }
      };
      fetchWinner();
    } else {
      setWinnerName(null);
    }
  }, [currentLot?.id, currentLot?.status]);

  const lotImages = [
    ...(currentLot?.image_url ? [currentLot.image_url] : []),
    ...(currentLot?.gallery_urls || [])
  ].filter((url, index, self) => self.indexOf(url) === index);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentImageIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  useEffect(() => {
    setDisplayTime(timeRemaining);
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isAuctionFinished = auction?.ends_at && new Date(auction.ends_at) < new Date() && !currentLot;

  if (!currentLot) {
    return (
      <Card className="border-2 border-brand-800 bg-brand-950/60 backdrop-blur-xl overflow-hidden min-h-[400px] flex items-center justify-center rounded-[2.5rem] p-4 relative group shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-50" />
        <CardContent className="p-12 text-center space-y-8 relative z-10 bg-brand-950/40 rounded-[2rem] w-full h-full flex flex-col items-center justify-center border border-white/5">
          <div className="relative">
            <div className="absolute inset-0 bg-gold/30 blur-[60px] rounded-full animate-pulse" />
            <div className="size-24 rounded-[2rem] bg-brand-800 border border-brand-700 flex items-center justify-center shadow-2xl group-hover:border-gold/50 transition-colors">
              {isAuctionFinished ? <Gavel className="size-12 text-slate-400" /> : <Clock className="size-12 text-gold animate-spin-slow" />}
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl section-title text-white">
              {isAuctionFinished ? 'Leilão Encerrado' : (transitionMessage || 'Aguardando Próximo Lote')}
            </h3>
            <p className="text-brand-400 text-sm font-medium max-w-[320px] mx-auto italic leading-relaxed">
              {isAuctionFinished 
                ? 'Este evento já foi finalizado. Agradecemos a participação de todos.' 
                : (transitionMessage ? 'Fique ligado, a transmissão continua!' : 'O leiloeiro está organizando as últimas propostas.')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentBid = Number(currentLot.current_highest_bid || currentLot.starting_price || 0);
  const increment = Number(currentLot.min_increment || 100);
  const nextBid = currentBid + increment;

  const handlePlaceBidWithConfirm = async (amount: number) => {
    if (!currentLot) return;
    
    const currentPrice = Number(currentLot.current_highest_bid || currentLot.starting_price || 0);
    const minIncrement = Number(currentLot.min_increment || 100);
    
    if (!amount || amount < currentPrice + minIncrement) {
      toast.error(`Lance deve ser de pelo menos ${formatCurrency(currentPrice + minIncrement)}`);
      return;
    }

    await onPlaceBid?.(currentLot.id, amount);
  };

  return (
    <div className="space-y-4 relative w-full overflow-hidden">
      <Card className="overflow-hidden border-2 border-brand-800 bg-brand-950/40 backdrop-blur-md shadow-2xl relative rounded-2xl md:rounded-[2.5rem] p-2">
        <div className="grid grid-cols-1 xl:grid-cols-12 bg-brand-900/20 rounded-xl md:rounded-[2rem] overflow-hidden min-w-0">
          
          {/* Image Gallery Column */}
          <div className="xl:col-span-6 relative group border-b xl:border-b-0 xl:border-r border-brand-800 bg-black flex flex-col items-center justify-center overflow-hidden min-h-[300px] md:min-h-[500px]">
            {lotImages.length > 0 ? (
              <>
                <div className="overflow-hidden w-full h-full cursor-zoom-in" ref={emblaRef} onClick={() => setIsLightboxOpen(true)}>
                  <div className="flex h-full">
                    {lotImages.map((src, i) => (
                      <div key={i} className="flex-[0_0_100%] min-w-0 h-full flex items-center justify-center">
                        <SmartImage
                          src={src}
                          alt={currentLot.title}
                          className="w-full h-full object-contain transition-transform duration-700 hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {lotImages.length > 1 && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/5">
                    {lotImages.map((src, i) => (
                      <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); scrollTo(i); }}
                        className={cn(
                          "size-12 rounded-lg border-2 overflow-hidden transition-all",
                          currentImageIndex === i ? "border-gold scale-110" : "border-white/20 opacity-50 grayscale hover:grayscale-0"
                        )}
                      >
                        <SmartImage src={src} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                  <Button
                    size="icon"
                    variant="outline"
                    className="bg-black/60 backdrop-blur-md rounded-full border-white/10 text-white size-10"
                    onClick={(e) => { e.stopPropagation(); emblaApi?.scrollPrev(); }}
                  >
                    <ChevronLeft className="size-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="bg-black/60 backdrop-blur-md rounded-full border-white/10 text-white size-10"
                    onClick={(e) => { e.stopPropagation(); emblaApi?.scrollNext(); }}
                  >
                    <ChevronRight className="size-5" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-brand-900 flex flex-col items-center justify-center gap-4 p-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-brand-500/10 blur-2xl rounded-full" />
                  <Gavel className="size-20 text-brand-800 relative z-10" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-brand-500 font-black uppercase tracking-widest text-xs">Aguardando Imagem</p>
                  <p className="text-brand-700 font-bold text-[10px] uppercase">O leiloeiro está preparando este lote</p>
                </div>
              </div>
            )}
            
            {/* Sold Overlay */}
            <AnimatePresence>
              {currentLot.status === 'sold' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center overflow-hidden"
                >
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full aspect-square bg-gold/10 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 aspect-square bg-gold/20 rounded-full blur-[60px] animate-bounce-slow" />
                  </div>

                  <motion.div
                    initial={{ scale: 0.8, y: 30, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: "spring", damping: 15, stiffness: 100 }}
                    className="relative z-10 space-y-6"
                  >
                    <div className="relative inline-block mb-2">
                      <div className="absolute inset-0 bg-gold/50 blur-[40px] rounded-full animate-pulse" />
                      <div className="size-28 rounded-full bg-gradient-to-br from-gold via-gold-light to-gold flex items-center justify-center shadow-[0_0_80px_rgba(234,179,8,0.6)] border-4 border-white/20 relative z-10 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                        <Trophy className="size-14 text-black animate-bounce-slow" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-6xl md:text-7xl font-black text-gold drop-shadow-[0_0_20px_rgba(234,179,8,0.5)] tracking-tighter italic uppercase leading-none">
                        VENDIDO!
                      </h2>
                      <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-gold to-transparent rounded-full opacity-50" />
                    </div>

                    {winnerName && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-3"
                      >
                        <p className="text-gold/60 text-[10px] font-black uppercase tracking-[0.4em] drop-shadow-sm">Arrematado por</p>
                        <div className="relative inline-block">
                           <div className="absolute inset-0 bg-white/5 blur-xl rounded-2xl" />
                           <p className="text-3xl md:text-4xl font-black text-white px-8 py-4 rounded-[2rem] border-2 border-white/10 backdrop-blur-xl shadow-premium relative z-10 tracking-tight">
                             {winnerName}
                           </p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Bidding & Status Section Column */}
          <div className="xl:col-span-6 p-6 md:p-8 flex flex-col justify-between bg-brand-950/40 space-y-8 min-w-0">
            
            {/* Header: Lot Title and Info */}
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <Badge className="bg-gold text-black font-black px-3 py-1 text-sm shadow-glow-gold">LOTE {currentLot.lot_order || '00'}</Badge>
                  {isRunning && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-red-600 rounded-full shadow-glow-red animate-pulse border border-red-500/50">
                       <div className="flex items-center bg-white text-red-600 px-1 py-0.5 rounded-sm text-[8px] font-black leading-none">LIVE</div>
                       <span className="text-[9px] font-black text-white uppercase tracking-widest">AO VIVO</span>
                    </div>
                  )}
               </div>
               
               <div className="space-y-2">
                 <h3 className="text-2xl md:text-3xl card-title text-white tracking-tight leading-tight">{currentLot.title}</h3>
                 {currentLot.description && (
                   <p className="text-brand-400 text-xs font-medium line-clamp-2">{currentLot.description}</p>
                 )}
               </div>
            </div>

            {/* Current Values & Timer */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/5 p-4 md:p-6 rounded-2xl border border-white/10 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-500">Lance Atual</p>
                  <p className="text-xl md:text-3xl font-black text-white tabular-nums tracking-tight">{formatCurrency(currentBid)}</p>
                  {currentLeaderId && (
                    <div className="pt-2 border-t border-white/5 mt-2">
                      <Badge className={cn(
                        "text-[9px] font-black px-3 py-1 border-none tracking-widest uppercase",
                        currentLeaderId === 'YOU' ? "bg-green-600 text-white animate-pulse" : "bg-brand-700 text-brand-300"
                      )}>
                        {currentLeaderId === 'YOU' ? 'VOCÊ LIDERANDO' : 'OUTRO LIDERANDO'}
                      </Badge>
                    </div>
                  )}
               </div>
               <div className="bg-white/5 p-4 md:p-6 rounded-2xl border border-white/10 flex flex-col justify-center items-end text-right space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-500">Tempo Restante</p>
                  <div className={cn(
                    "text-3xl md:text-5xl font-black tabular-nums tracking-tighter leading-none",
                    displayTime <= 10 ? "text-red-500 animate-pulse" : "text-green-400"
                  )}>
                    {formatTime(displayTime)}
                  </div>
               </div>
            </div>

            <div className="space-y-6">
              {/* Manual Bid Section for Admin */}
              {isModerator && isRunning && (
                <div className="bg-brand-800/40 border-gold/30 p-4 rounded-2xl border space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black text-gold uppercase tracking-widest">Controle de Lote (Leiloeiro)</p>
                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-6 text-[8px] px-2 bg-brand-950 border-white/10"
                        onClick={() => onAddTime?.(10)}
                      >+10s</Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-6 text-[8px] px-2 bg-brand-950 border-white/10"
                        onClick={() => onAddTime?.(30)}
                      >+30s</Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-6 text-[8px] px-2 bg-brand-950 border-white/10"
                        onClick={() => onAddTime?.(60)}
                      >+1m</Button>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-white/40" />
                      <input 
                        type="text" 
                        placeholder="Nome / Tel" 
                        className="w-full bg-brand-950 border-brand-700 text-white text-xs h-10 pl-9 pr-3 rounded-xl outline-none border focus:border-gold/50 transition-colors"
                        value={manualBidName}
                        onChange={(e) => setManualBidName(e.target.value)}
                      />
                    </div>
                    <input 
                      type="text" 
                      placeholder={formatNumberBR(nextBid)}
                      className="w-32 bg-brand-950 border-brand-700 text-white text-xs h-10 px-3 rounded-xl outline-none border focus:border-gold/50 transition-colors"
                      value={manualBidAmount}
                      onChange={(e) => setManualBidAmount(maskCurrency(e.target.value))}
                    />
                    <Button 
                      className="h-10 bg-gold hover:bg-gold/90 text-black font-black text-[10px] uppercase rounded-xl px-4"
                      onClick={async () => {
                        const amount = manualBidAmount ? parseBRNumber(manualBidAmount) : nextBid;
                        setAdminPendingAction({ type: 'manual_sell', amount, name: manualBidName || 'Mesa / Telefone' });
                        setManualBidName('');
                        setManualBidAmount('');
                      }}
                    >
                      LANÇAR
                    </Button>
                  </div>
                </div>
              )}

              {/* Quick Bid Buttons */}
              {currentLot && (
                <div className="space-y-4">
                  {!isRunning && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center gap-2 mb-2">
                      <AlertTriangle className="size-4 text-amber-500" />
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Lance suspenso ou aguardando abertura do leiloeiro</span>
                    </div>
                  )}
                  {!isAdmin && auction?.require_deposit && depositStatus !== 'approved' && (
                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-2 mb-4">
                      <ShieldAlert className="size-4 text-red-500" />
                      <div className="flex-1">
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block">Habilitação Obrigatória</span>
                        <span className="text-[8px] text-red-400 font-bold uppercase italic">Sua caução precisa ser aprovada para você participar deste leilão.</span>
                      </div>
                    </div>
                  )}
                  <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-3 transition-opacity", (!isRunning || currentLot.status === 'sold' || (!isAdmin && auction?.require_deposit && depositStatus !== 'approved')) && "opacity-50 pointer-events-none")}>
                    <Button
                      className="h-16 rounded-xl flex flex-col items-center justify-center bg-brand-500 hover:bg-brand-600 border-b-4 border-brand-700 active:border-b-0 active:translate-y-1 transition-all px-2 overflow-hidden"
                      disabled={(!isAdmin && auction?.require_deposit && depositStatus !== 'approved')}
                      onClick={() => handlePlaceBidWithConfirm(nextBid)}
                    >
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-70 italic truncate w-full px-1">Lance Mínimo</span>
                        <span className="text-lg font-black tabular-nums tracking-tighter truncate w-full px-1">{formatCurrency(nextBid)}</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-16 rounded-xl flex flex-col items-center justify-center border-white/10 hover:bg-white/5 border-b-4 border-white/20 active:border-b-0 active:translate-y-1 transition-all px-2 overflow-hidden"
                      disabled={(!isAdmin && auction?.require_deposit && depositStatus !== 'approved')}
                      onClick={() => handlePlaceBidWithConfirm(currentBid + (increment * 2))}
                    >
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-50 truncate w-full px-1">+ {formatCurrency(increment * 2)}</span>
                        <span className="text-base font-black text-gold tabular-nums tracking-tighter truncate w-full px-1">{formatCurrency(currentBid + (increment * 2))}</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-16 rounded-xl flex flex-col items-center justify-center border-white/10 hover:bg-white/5 border-b-4 border-white/20 active:border-b-0 active:translate-y-1 transition-all px-2 overflow-hidden"
                      disabled={(!isAdmin && auction?.require_deposit && depositStatus !== 'approved')}
                      onClick={() => handlePlaceBidWithConfirm(currentBid + (increment * 5))}
                    >
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-50 truncate w-full px-1">+ {formatCurrency(increment * 5)}</span>
                        <span className="text-base font-black text-gold tabular-nums tracking-tighter truncate w-full px-1">{formatCurrency(currentBid + (increment * 5))}</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Controls Footer */}
            {isModerator && (
               <div className="pt-6 border-t border-white/5 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className={cn("size-2 rounded-full", auction?.streaming_active ? "bg-red-600 animate-pulse" : "bg-white/20")} />
                      <span className="text-[10px] font-black uppercase text-white/70">Transmissão {auction?.streaming_active ? 'Ativa' : 'Inativa'}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[8px] font-black uppercase bg-white/10"
                      onClick={() => onUpdateAuction?.({ streaming_active: !auction?.streaming_active })}
                    >
                      {auction?.streaming_active ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      className={cn("h-14 font-black rounded-xl border-none", isRunning ? "bg-amber-600" : "bg-green-600")}
                      onClick={() => onToggleRunning(!isRunning)}
                    >
                      {isRunning ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                      {isRunning ? 'PAUSAR' : 'INICIAR'}
                    </Button>
                    <Button 
                      className={cn(
                        "h-14 font-black rounded-xl border-none shadow-glow-red transition-all flex flex-col items-center justify-center leading-tight",
                        currentLot.status === 'sold' ? "bg-slate-700 opacity-50 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                      )}
                      disabled={currentLot.status === 'sold'}
                      onClick={() => {
                        if (manualBidName) {
                          const amount = manualBidAmount ? parseBRNumber(manualBidAmount) : nextBid;
                          setAdminPendingAction({ type: 'manual_sell', amount, name: manualBidName });
                        } else {
                          setAdminPendingAction({ type: 'hammer' });
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Gavel className="size-5" />
                        <span>{currentLot.status === 'sold' ? 'LOTE VENDIDO' : (manualBidName ? 'VENDER PARA TEL' : 'ARREMATAR')}</span>
                      </div>
                      {manualBidName && currentLot.status !== 'sold' && <span className="text-[8px] opacity-70 mt-1 uppercase truncate max-w-full">Licitante: {manualBidName}</span>}
                    </Button>
                  </div>
               </div>
            )}

          </div>
        </div>
      </Card>
      
      {/* Fila de Próximos Lotes */}
      {upcomingLots.length > 0 && (
        <div className="w-full overflow-x-auto pb-1">
          <div className="flex items-center gap-3 min-w-max px-1">
            <span className="text-[9px] font-black text-brand-500 uppercase tracking-widest shrink-0">Próximos →</span>
            {upcomingLots.map(lot => (
              <div key={lot.id} className="flex items-center gap-2 bg-brand-900/60 border border-brand-800 hover:border-gold/30 rounded-xl px-3 py-2 shrink-0 transition-colors">
                <div className="size-5 rounded-lg bg-brand-800 flex items-center justify-center text-[8px] font-black text-white/70">
                  {lot.lot_order}
                </div>
                <div>
                  <p className="text-[9px] font-black text-white truncate max-w-[120px]">{lot.title}</p>
                  <p className="text-[8px] text-brand-500 font-bold">{formatCurrency(Number(lot.starting_price))}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox for full images */}
      {lotImages.length > 0 && (
        <ImageLightbox
          open={isLightboxOpen}
          close={() => setIsLightboxOpen(false)}
          images={lotImages}
          index={currentImageIndex}
        />
      )}

      <BidConfirmDialog
        isOpen={!!adminPendingAction}
        onClose={() => setAdminPendingAction(null)}
        onConfirm={() => {
          if (adminPendingAction) {
            if (adminPendingAction.type === 'manual_sell') {
              onManualBid?.(adminPendingAction.name!, adminPendingAction.amount!).then(() => onCloseLot());
            } else {
              onCloseLot();
            }
          }
          setAdminPendingAction(null);
        }}
        amount={adminPendingAction?.amount || 0}
        title={adminPendingAction?.type === 'manual_sell' ? "Confirmar Venda Manual" : "Bater Martelo"}
        description={
          adminPendingAction?.type === 'manual_sell' 
            ? `Deseja realmente vender este lote para ${adminPendingAction.name} por ${formatCurrency(adminPendingAction.amount || 0)}?`
            : "Deseja realmente bater o martelo para o lance atual e encerrar este lote?"
        }
      />
    </div>
  );
}
