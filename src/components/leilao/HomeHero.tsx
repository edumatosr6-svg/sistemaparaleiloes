import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight, ShieldCheck, Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from "@/lib/utils";
import { Link } from '@tanstack/react-router';
import { SmartImage } from '../SmartImage';

export function HomeHero({ content }: { content?: any }) {
  const [current, setCurrent] = useState(0);

  const query = useQuery({
    queryKey: ['home-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return { 
        items: data || [], 
        timestamp: new Date().getTime() 
      };
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always'
  });

  const isLoading = query.isLoading;
  const banners = query.data?.items || [];
  const timestamp = query.data?.timestamp;

  useEffect(() => {
    if (banners && banners.length > 1) {
      const timer = setInterval(() => {
        setCurrent((prev) => (prev + 1) % banners.length);
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [banners]);

  const defaultImages = [
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
  ];

  if (isLoading) {
    return (
      <div className="h-[90vh] w-full bg-black flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Carregando Mega Leilões Hot Toys...</p>
        </div>
      </div>
    );
  }

  const displayBanners = banners.length > 0 ? banners : defaultImages.map((img, idx) => ({
    id: `default-${idx}`,
    image_url: img,
    title: idx === 0 ? "Fantasias Épicas & Colecionáveis" : idx === 1 ? "Trajes de Cinema Autênticos" : "Armaduras de Luxo",
    link_url: "#"
  }));

  const currentBanner = displayBanners[current % displayBanners.length];

  return (
    <section className="relative min-h-[85vh] lg:h-screen w-full overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBanner.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
          <SmartImage
            src={currentBanner.image_url ? `${currentBanner.image_url}${currentBanner.image_url.includes('supabase.co') ? (currentBanner.image_url.includes('?') ? '&' : '?') + 't=' + timestamp : ''}` : ''}
            alt={currentBanner.title || ''}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-20 h-full flex flex-col justify-center pt-32 sm:pt-40 pb-12 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="space-y-6 md:space-y-8 max-w-full">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex items-center gap-3"
          >
            <span className="bg-gold text-black text-[10px] font-black px-4 py-1.5 rounded-full tracking-[0.2em] uppercase shadow-glow-gold">
              LEILÃO EXCLUSIVO
            </span>
            <span className="text-white/60 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-500" />
              Verificado por Mega Leilões Hot Toys
            </span>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.h1
              key={currentBanner.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.8 }}
              className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl hero-title text-white leading-[0.7] tracking-tighter break-words drop-shadow-2xl mb-6"
            >
              {currentBanner.title || content?.title || 'Mega Leilões Hot Toys'}
            </motion.h1>
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="flex flex-col md:flex-row gap-8 md:gap-12 pt-4 md:pt-6"
          >
            <div className="space-y-1">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Status do Evento</p>
              <div className="flex items-center gap-3">
                <div className="size-3 rounded-full bg-green-500 animate-pulse shadow-glow-green" />
                <p className="text-sm md:text-base font-black italic uppercase text-white drop-shadow-lg leading-none tracking-tight font-archivo">Disputas Ativas</p>
              </div>
            </div>
            <div className="hidden md:block h-16 w-px bg-white/10" />
            <div className="space-y-1">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Sua Segurança</p>
              <div className="flex items-center gap-3 text-2xl font-black text-gold">
                <ShieldCheck className="w-6 h-6" />
                AUDITORIA 100% ATIVA
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 md:gap-6 pt-4 md:pt-6"
          >
            <Button 
              size="lg" 
              className="h-14 md:h-16 px-8 md:px-12 rounded-full font-black text-sm md:text-base group"
              asChild
            >
              <Link to={currentBanner.link_url || '#'}>
                Participar agora
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="h-14 md:h-16 px-8 md:px-12 rounded-full font-black text-sm md:text-base backdrop-blur-md"
              asChild
            >
              <a href="#categories">Ver Catálogo</a>
            </Button>
          </motion.div>
        </div>
      </div>

      {displayBanners.length > 1 && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-3 z-30">
          {displayBanners.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "h-1 transition-all duration-500 rounded-full",
                current === i ? "w-12 bg-gold" : "w-6 bg-white/20 hover:bg-white/40"
              )}
            />
          ))}
        </div>
      )}

      <div className="absolute bottom-20 right-12 hidden xl:flex items-center gap-12 text-white/40 z-30">
        <div className="text-right group">
          <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-gold/80 group-hover:text-gold transition-colors">Arremates</p>
          <p className="text-3xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform">+12.000</p>
        </div>
        <div className="h-10 w-px bg-white/10" />
        <div className="text-right group">
          <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-gold/80 group-hover:text-gold transition-colors">Investidores</p>
          <p className="text-3xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform">+450k</p>
        </div>
        <div className="size-20 rounded-[2rem] border border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-2xl shadow-2xl group hover:border-gold/50 transition-all duration-500">
           <Trophy className="size-8 text-gold group-hover:scale-110 transition-transform" />
        </div>
      </div>
    </section>
  );
}