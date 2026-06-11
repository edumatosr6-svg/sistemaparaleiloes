import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Trophy, Star } from 'lucide-react';
import { SmartImage } from '../SmartImage';

export function RecentWinnersCarousel({ content }: { content?: any }) {
  const { data: winners } = useQuery({
    queryKey: ['recent-winners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('winners_public' as any)
        .select(`
          id,
          final_amount,
          lot_title,
          lot_image_url,
          winner_name
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  if (!winners || winners.length === 0) return null;

  return (
    <section className="py-20 bg-brand-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-10 flex flex-col items-center text-center space-y-4">
        <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-gold/10 border border-gold/20">
          <Trophy className="w-3 h-3 text-gold" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gold">{content?.subtitle || "Hall da Fama"}</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase">
          {content?.title || "Últimos Arrematantes"}
        </h2>
        <p className="text-brand-400 text-sm max-w-xl">
          {content?.description || "Confira os investidores que garantiram os lotes mais exclusivos recentemente em nossa plataforma."}
        </p>
      </div>

      <div className="relative group">
        <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-brand-950 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-brand-950 to-transparent z-10" />
        
        <div className="flex animate-scroll hover:[animation-play-state:paused] gap-6 px-10">
          {[...winners, ...winners].map((winner: any, idx) => (
            <motion.div 
              key={`${winner.id}-${idx}`}
              whileHover={{ scale: 1.05 }}
              className="flex-shrink-0 w-72 h-96 relative rounded-[2rem] overflow-hidden border border-brand-800 shadow-premium group/card"
            >
              <SmartImage 
                src={winner.lot_image_url || '/placeholder.svg'}
                alt={winner.lot_title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              
              <div className="absolute top-4 right-4 flex gap-1">
                <div className="bg-gold p-1.5 rounded-full shadow-lg">
                  <Star className="w-3 h-3 text-black fill-black" />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">Arrematado por</p>
                  <h3 className="text-xl font-black text-white uppercase italic truncate">
                    {winner.winner_name || 'Usuário Verificado'}
                  </h3>
                </div>
                
                <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Valor Final</p>
                    <p className="text-lg font-black text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(winner.final_amount))}
                    </p>
                  </div>
                  <div className="bg-brand-600/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <span className="text-[9px] font-black text-white uppercase">Premium</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
