import { createFileRoute, Link } from '@tanstack/react-router';
import { SiteHeader } from '@/components/leilao/SiteHeader';
import { SiteFooter } from '@/components/leilao/SiteFooter';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SkeletonPremium } from '@/components/ui/skeleton-premium';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Gavel, ArrowRight, Package, Search, LayoutGrid, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { LotCard } from '@/components/leilao/LotCard';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/categoria/$slug')({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  const { data: category, isLoading: isLoadingCategory } = useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: lots, isLoading: isLoadingLots } = useQuery({
    queryKey: ['category-lots', category?.id],
    enabled: !!category?.id,
    queryFn: async () => {
      if (!category) return [];
      const { data, error } = await supabase
        .from('lots')
        .select(`
          *,
          auctions:auction_id(title)
        `)
        .eq('category_id', category.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <main className="pt-32 pb-24 px-4 lg:px-12">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header Section */}
          <div className="space-y-4">
            {isLoadingCategory ? (
              <SkeletonPremium className="h-12 w-64" />
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-gold">Explorar Categoria</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground uppercase italic leading-[0.9]">
                      {category?.name}
                    </h1>
                  </div>

                  <div className="flex items-center gap-2 bg-brand-900/40 p-1.5 rounded-full border border-brand-800">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        "rounded-full px-4 font-black text-[10px] uppercase tracking-widest h-8 transition-all",
                        viewMode === 'grid' ? "bg-gold text-black shadow-glow-gold" : "text-brand-400 hover:text-white"
                      )}
                    >
                      <LayoutGrid className="w-3.5 h-3.5 mr-2" />
                      Grade
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setViewMode('compact')}
                      className={cn(
                        "rounded-full px-4 font-black text-[10px] uppercase tracking-widest h-8 transition-all",
                        viewMode === 'compact' ? "bg-gold text-black shadow-glow-gold" : "text-brand-400 hover:text-white"
                      )}
                    >
                      <List className="w-3.5 h-3.5 mr-2" />
                      Compacto
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Lots Grid */}
          {isLoadingLots ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="space-y-4">
                  <SkeletonPremium className="aspect-video w-full rounded-[2rem]" />
                  <div className="space-y-2">
                    <SkeletonPremium className="h-6 w-3/4" />
                    <SkeletonPremium className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : lots?.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-32 px-6 bg-brand-900/20 rounded-[4rem] border-2 border-dashed border-brand-800/50 space-y-8 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-950/40 pointer-events-none" />
              <div className="relative z-10 space-y-8">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gold/10 blur-2xl rounded-full" />
                  <div className="size-24 bg-brand-900 rounded-[2rem] border border-brand-800 flex items-center justify-center mx-auto shadow-2xl transition-all group-hover:border-gold/30">
                    <Search className="size-10 text-brand-700" />
                  </div>
                </div>
                <div className="space-y-3 max-w-md mx-auto">
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">Lotes em Preparação</h2>
                  <p className="text-brand-400 font-medium leading-relaxed">
                    Nossa curadoria está selecionando os melhores itens desta categoria. Em breve teremos novidades imperdíveis por aqui.
                  </p>
                </div>
                <div className="pt-4">
                  <Button size="lg" className="h-16 px-10 bg-gold text-black hover:bg-gold-light rounded-full font-black uppercase tracking-widest text-xs shadow-glow-gold transition-all hover:scale-105 active:scale-95" asChild>
                    <Link to="/">Voltar para a Vitrine</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className={cn(
              "grid gap-6 md:gap-8",
              viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
            )}>
              {lots?.map((lot, i) => (
                <LotCard 
                  key={lot.id} 
                  lot={lot} 
                  variant={viewMode === 'grid' ? 'default' : 'compact'} 
                  delay={i * 0.05} 
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
