import { createFileRoute, Link } from '@tanstack/react-router';
import { Suspense, lazy, memo } from 'react';
import { SiteHeader } from '@/components/leilao/SiteHeader';
import { HomeHero } from '@/components/leilao/HomeHero';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Lazy load non-critical sections to improve initial mobile load
const LiveAuctionsSection = lazy(() => import('@/components/leilao/HomeSections').then(m => ({ default: m.LiveAuctionsSection })));
const PlatformStatsSection = lazy(() => import('@/components/leilao/HomeSections').then(m => ({ default: m.PlatformStatsSection })));
const CategoriesSection = lazy(() => import('@/components/leilao/HomeSections').then(m => ({ default: m.CategoriesSection })));
const TopBuyersSection = lazy(() => import('@/components/leilao/HomeSections').then(m => ({ default: m.TopBuyersSection })));
const CurrentLotHighlight = lazy(() => import('@/components/leilao/HomeSections').then(m => ({ default: m.CurrentLotHighlight })));
const FeaturedLotsSection = lazy(() => import('@/components/leilao/HomeSections').then(m => ({ default: m.FeaturedLotsSection })));
const HowItWorksSection = lazy(() => import('@/components/leilao/HomeSections').then(m => ({ default: m.HowItWorksSection })));
const SecurityRulesSection = lazy(() => import('@/components/leilao/HomeSections').then(m => ({ default: m.SecurityRulesSection })));
const RecentWinnersCarousel = lazy(() => import('@/components/leilao/RecentWinnersCarousel').then(m => ({ default: m.RecentWinnersCarousel })));

import { SiteFooter } from '@/components/leilao/SiteFooter';
import { QuickBar } from '@/components/leilao/QuickBar';
import { SEO } from '@/components/SEO';

const SectionSkeleton = () => (
  <div className="py-24 md:py-32 px-4 lg:px-12 animate-pulse">
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="h-8 w-48 bg-white/5 rounded-full" />
      <div className="h-16 w-3/4 bg-white/5 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="aspect-[16/10] bg-white/5 rounded-[2.5rem]" />
        <div className="aspect-[16/10] bg-white/5 rounded-[2.5rem]" />
        <div className="aspect-[16/10] bg-white/5 rounded-[2.5rem]" />
      </div>
    </div>
  </div>
);

const SectionWrapper = memo(({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<SectionSkeleton />}>
    {children}
  </Suspense>
));

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const { data: sections, isLoading } = useQuery({
    queryKey: ['home-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_sections')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  const renderSection = (key: string, content: any) => {
    switch (key) {
      case 'hero': return <HomeHero key="hero" content={content} />;
      case 'live_auctions': return (
        <SectionWrapper key="live_auctions">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <LiveAuctionsSection content={content} />
          </motion.div>
        </SectionWrapper>
      );
      case 'current_lot': return (
        <SectionWrapper key="current_lot">
          <CurrentLotHighlight content={content} />
        </SectionWrapper>
      );
      case 'how_it_works': return (
        <SectionWrapper key="how_it_works">
          <HowItWorksSection content={content} />
        </SectionWrapper>
      );
      case 'security_rules': return (
        <SectionWrapper key="security_rules">
          <SecurityRulesSection content={content} />
        </SectionWrapper>
      );
      case 'featured_lots': return (
        <SectionWrapper key="featured_lots">
          <FeaturedLotsSection content={content} />
        </SectionWrapper>
      );
      case 'stats': return (
        <SectionWrapper key="stats">
          <div id="resultados">
            <PlatformStatsSection content={content} />
          </div>
        </SectionWrapper>
      );
      case 'categories': return (
        <SectionWrapper key="categories">
          <div id="categories">
            <CategoriesSection content={content} />
          </div>
        </SectionWrapper>
      );
      case 'top_buyers': return (
        <SectionWrapper key="top_buyers">
          <TopBuyersSection content={content} />
        </SectionWrapper>
      );
      case 'cta': return (
        <section key="cta" className="py-24 md:py-32 px-4 lg:px-12 bg-brand-600 relative overflow-hidden rounded-[2rem] sm:rounded-[3rem] mx-4 lg:mx-12 my-10">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute -right-20 -top-20 size-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 size-96 rounded-full bg-black/20 blur-3xl" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8 md:space-y-10">
            <h2 className="text-4xl md:text-7xl section-title text-white italic">
              {content?.title || "Pronto para seu próximo arremate?"}
            </h2>
            <p className="text-white/80 text-lg md:text-xl font-medium max-w-2xl mx-auto">
              {content?.subtitle || "Cadastre-se hoje e tenha acesso antecipado aos lotes mais exclusivos do mercado de luxo nacional."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/entrar" className="bg-white text-brand-600 px-8 md:px-12 py-4 md:py-6 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-transform text-xs md:text-sm">
                Criar Conta Grátis
              </Link>
              <button className="bg-transparent border-2 border-white text-white px-8 md:px-12 py-4 md:py-6 rounded-full font-black uppercase tracking-widest hover:bg-white hover:text-brand-600 transition-all text-xs md:text-sm">
                Falar com Especialista
              </button>
            </div>
          </div>
        </section>
      );
      case 'winners_carousel': return (
        <SectionWrapper key="winners_carousel">
          <RecentWinnersCarousel content={content} />
        </SectionWrapper>
      );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-brand-950 selection:bg-brand-500 selection:text-white">
      <SiteHeader />
      <SEO />
      
      <main>
        {isLoading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold"></div>
          </div>
        ) : (
          sections?.map(section => renderSection(section.key, section.content))
        )}
      </main>


      <SiteFooter />
      
      {/* Real-time QuickBar at the bottom */}
      <QuickBar />
    </div>
  );
}
