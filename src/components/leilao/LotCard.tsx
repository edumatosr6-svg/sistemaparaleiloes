
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Package, Gavel, Heart } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { FavoriteButton } from './FavoriteButton';
import { SmartImage } from '../SmartImage';

interface LotCardProps {
  lot: any;
  variant?: 'default' | 'compact';
  className?: string;
  delay?: number;
}

export function LotCard({ lot, variant = 'default', className, delay = 0 }: LotCardProps) {
  const isCompact = variant === 'compact';
  const currentBid = Number(lot.current_highest_bid || lot.starting_price || 0);
  const isEnded = lot.status === 'sold' || lot.status === 'unsold' || lot.status === 'cancelled';

  if (isCompact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.4 }}
        className={className}
      >
        <Card className={cn("group overflow-hidden bg-brand-950/50 border-brand-800/50 hover:border-gold/30 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)] transition-all duration-300 rounded-2xl h-full", isEnded && "opacity-60 grayscale")} asChild>
          <Link to={`/lote/${lot.id}`}>
            <div className="flex flex-row h-full">
              <div className="relative w-1/3 min-w-[100px] aspect-square overflow-hidden bg-black/20">
                <SmartImage
                  src={lot.image_url || "/placeholder.svg"}
                  alt={lot.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-[8px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                  #{lot.lot_order || '0'}
                </div>
                {isEnded && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white font-black text-[9px] uppercase tracking-widest rotate-[-5deg] border border-white/30 px-2 py-0.5 rounded">
                      {lot.status === 'sold' ? 'Arrematado' : 'Encerrado'}
                    </span>
                  </div>
                )}
              </div>
              <CardContent className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-white line-clamp-1 uppercase tracking-tight mb-1 group-hover:text-gold transition-colors italic">
                    {lot.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[9px] text-brand-400 font-bold uppercase tracking-widest">
                    <Package className="w-2.5 h-2.5 text-gold/60" />
                    <span className="line-clamp-1">{(lot.auctions as any)?.title || 'Evento'}</span>
                  </div>
                </div>

                <div className="flex items-end justify-between mt-2">
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-brand-500 uppercase tracking-widest">Lance Atual</p>
                    <p className="text-sm font-black text-gold tabular-nums tracking-tighter">
                      {formatCurrency(currentBid)}
                    </p>
                  </div>
                  <div className="size-6 rounded-full bg-brand-800 text-brand-300 flex items-center justify-center shrink-0 group-hover:bg-gold group-hover:text-black transition-all group-hover:rotate-[-45deg]">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </CardContent>
            </div>
          </Link>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className={cn("h-full", className)}
    >
      <Card className={cn("group relative h-full bg-brand-900 border border-brand-800 hover:border-gold/50 transition-all duration-500 shadow-2xl hover:shadow-[0_0_40px_rgba(212,175,55,0.15)] rounded-[2.5rem] overflow-hidden", isEnded && "opacity-60 grayscale")} asChild>
        <Link to={`/lote/${lot.id}`}>
          <div className="relative aspect-[4/3] overflow-hidden bg-black">
            <SmartImage 
              src={lot.image_url || "/placeholder.svg"}
              alt={lot.title} 
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            <div className="absolute top-6 left-6 flex gap-2">
              <div className="bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-xl">
                Lote #{lot.lot_order || '0'}
              </div>
              {lot.is_highlight && (
                <div className="bg-gold text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-glow-gold">
                  Destaque
                </div>
              )}
            </div>

            <div className="absolute top-6 right-6">
              <FavoriteButton lotId={lot.id} className="bg-black/60 backdrop-blur-md border border-white/10" />
            </div>

            <div className="absolute bottom-6 right-6 bg-gold text-black size-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 shadow-glow-gold z-10">
              <Gavel className="size-6" />
            </div>

            {isEnded && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px] flex items-center justify-center z-20">
                <span className="text-white font-black text-2xl tracking-tighter uppercase border-4 border-white/20 px-8 py-3 rounded-2xl rotate-[-5deg] shadow-2xl">
                  {lot.status === 'sold' ? 'ARREMATADO' : lot.status === 'pending' ? 'AGUARDANDO' : 'ENCERRADO'}
                </span>
              </div>
            )}
          </div>

          <CardContent className="p-8 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-500">
                <Package className="size-3.5 text-gold/60" />
                <span className="line-clamp-1">{(lot.auction as any)?.title || (lot.auctions as any)?.title || 'Leilão Premium'}</span>
              </div>
              <h3 className="text-2xl font-black text-white line-clamp-2 italic uppercase tracking-tighter group-hover:text-gold transition-colors leading-tight">
                {lot.title}
              </h3>
            </div>
            
            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-400">Lance Atual</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-black text-gold">R$</span>
                  <span className="text-3xl font-black text-white tracking-tighter tabular-nums">
                    {formatCurrency(currentBid)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {lot.buyout_enabled && lot.buyout_price && lot.buyout_price > 0 && lot.status === 'active' && (
                  <div className="space-y-1 text-right hidden sm:block">
                    <p className="text-[9px] font-black uppercase tracking-widest text-brand-500">Compre Já</p>
                    <p className="text-sm font-black text-white italic">
                      {formatCurrency(Number(lot.buyout_price))}
                    </p>
                  </div>
                )}
                <div className="size-14 rounded-full bg-white/5 text-white flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-black transition-all group-hover:rotate-[-45deg] border border-white/10 group-hover:border-white shadow-xl">
                  <ArrowRight className="size-6" />
                </div>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  );
}
