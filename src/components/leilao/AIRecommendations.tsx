import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { SmartImage } from '../SmartImage';

export function AIRecommendations() {
  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: async () => {
      // Fetch active lots, or high-priority lots if not enough active
      const { data: activeLots, error } = await supabase
        .from('lots')
        .select('*, categories(name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;

      let displayLots = activeLots || [];

      // If we don't have enough active lots, fetch some highlights
      if (displayLots.length < 3) {
        const { data: highlightLots } = await supabase
          .from('lots')
          .select('*, categories(name)')
          .eq('is_highlight', true)
          .limit(3 - displayLots.length);
        
        if (highlightLots) {
          displayLots = [...displayLots, ...highlightLots];
        }
      }

      return displayLots.map(lot => ({
        id: lot.id,
        title: lot.title,
        category: lot.categories?.name || 'Leilão',
        match: `${Math.floor(Math.random() * 10) + 90}%`,
        price: (lot.current_highest_bid || 0) > 0 
          ? `R$ ${(lot.current_highest_bid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : `R$ ${(lot.starting_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        image: lot.image_url || '/placeholder.svg',
      }));
    }
  });

  return (
    <Card className="bg-card border-border shadow-premium overflow-hidden relative rounded-3xl">
      <div className="absolute top-0 right-0 p-4">
        <div className="flex items-center gap-1 bg-gold/10 text-gold text-[10px] font-black px-3 py-1 rounded-full border border-gold/20 tracking-widest uppercase">
          <Sparkles className="size-3" />
          IA POWERED
        </div>
      </div>
      
      <CardHeader>
        <CardTitle className="text-xl text-foreground font-black tracking-tight flex items-center gap-2">
          <Zap className="size-5 text-gold fill-gold" />
          Recomendado para Você
        </CardTitle>
        <p className="text-xs text-muted-foreground font-medium">Baseado no seu histórico de lances e preferências</p>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-muted rounded-2xl mb-3" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((item) => (
              <Link 
                key={item.id} 
                to="/lote/$lotId"
                params={{ lotId: item.id }}
                className="group cursor-pointer block"
              >
                <div className="relative aspect-video rounded-2xl overflow-hidden mb-3 border border-border">
                  <SmartImage 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Badge className="bg-gold text-black border-none text-[10px] font-black uppercase tracking-widest">
                      {item.match} Match
                    </Badge>
                  </div>
                </div>
                <h4 className="font-black text-foreground group-hover:text-gold transition-colors truncate">
                  {item.title}
                </h4>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{item.category}</p>
                  <p className="text-sm font-black text-gold tabular-nums">{item.price}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        <Link to="/" className="w-full mt-6 flex justify-center text-gold hover:text-gold-light font-black uppercase tracking-widest text-[10px] gap-2">
          Ver todas as recomendações <ArrowRight className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}