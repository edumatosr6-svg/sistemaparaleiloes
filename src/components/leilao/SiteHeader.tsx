import { Link } from '@tanstack/react-router';
import { Settings, Search, User, Menu, MonitorPlay, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { SmartImage } from '../SmartImage';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import { NotificationBell } from '../painel/NotificationBell';

export function SiteHeader({ isFixed = true }: { isFixed?: boolean }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setIsAdmin(data?.role === 'admin');
      } else {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [user]);
  
  const { data: liveAuction } = useQuery({
    queryKey: ['live-auction-now'],
    queryFn: async () => {
      // Primeiro busca se há algum leilão com lote em disputa (is_running) ou lote em tela
      const { data: liveControls } = await supabase
        .from('live_auction_control')
        .select('auction_id, is_running, current_lot_id, auctions(id, title, status, streaming_active)')
        .or('is_running.eq.true,current_lot_id.not.is.null');
      
      if (liveControls && liveControls.length > 0) {
        // Priorizar o que está rodando (is_running)
        const running = liveControls.find(c => c.is_running);
        const control = running || liveControls[0];
        const auction = Array.isArray(control.auctions) ? control.auctions[0] : control.auctions;
        
        if (auction && auction.status !== 'closed') {
          return auction;
        }
      }

      // Fallback para leilão com streaming ativo
      const { data: activeAuctions, error } = await supabase
        .from('auctions')
        .select('id, title, streaming_active')
        .eq('streaming_active', true)
        .eq('status', 'active')
        .limit(1);
      
      if (error || !activeAuctions || activeAuctions.length === 0) return null;
      return activeAuctions[0];
    },
    refetchInterval: 10000
  });

  const { data: siteConfigData } = useQuery({
    queryKey: ['site-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'site_config')
        .maybeSingle();
      
      if (error) throw error;
      return {
        value: data?.value as any,
        timestamp: new Date().getTime()
      };
    }
  });

  const siteConfig = siteConfigData?.value;
  const configTimestamp = siteConfigData?.timestamp;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Banner de Leilão Ao Vivo */}
      {liveAuction && (
        <div className="bg-red-600 text-white py-2 px-4 text-center overflow-hidden relative z-[60] shadow-[0_4px_20px_rgba(220,38,38,0.3)] min-h-[40px] flex items-center justify-center">
          <Link 
            to="/leilao/$auctionId/live" 
            params={{ auctionId: liveAuction.id }} 
            className="absolute inset-0 flex items-center justify-center gap-3 group cursor-pointer z-[70]"
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white text-red-600 px-2 py-0.5 rounded-sm font-black text-[9px] tracking-tighter animate-pulse shadow-sm">
                LIVE
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden sm:inline">LEILÃO AO VIVO AGORA:</span>
            </div>
            <span className="text-sm font-black uppercase truncate max-w-[200px] sm:max-w-md group-hover:underline underline-offset-4">{liveAuction.title}</span>
            <Badge variant="outline" className="text-white border-white/40 text-[9px] font-black px-3 group-hover:bg-white group-hover:text-red-600 transition-colors shrink-0">ACESSAR AUDITÓRIO</Badge>
          </Link>
        </div>
      )}

      <nav className={cn(
        isFixed ? "fixed" : "relative",
        liveAuction ? (isScrolled ? "top-0" : "top-9 md:top-8") : "top-0",
        "left-0 right-0",
        "z-50 transition-all duration-500 px-4 sm:px-6 lg:px-12 py-3 sm:py-4 flex items-center justify-between",
        isScrolled 
          ? "bg-brand-950/80 backdrop-blur-xl border-b border-brand-800/50 py-2 sm:py-3 shadow-premium" 
          : "bg-transparent py-4 sm:py-5"
      )}>
        <div className="flex items-center gap-6 lg:gap-10">
          <Link to="/" className="text-xl md:text-3xl font-black tracking-tighter hover:opacity-80 transition-opacity flex items-center gap-1 text-white shrink-0">
            {siteConfig?.logo_url ? (
              <SmartImage 
                src={`${siteConfig.logo_url}${siteConfig.logo_url.includes('supabase.co') ? (siteConfig.logo_url.includes('?') ? '&' : '?') + 't=' + configTimestamp : ''}`} 
                alt={siteConfig.name} 
                style={{ height: `${(siteConfig.logo_height || 40) * 1.2}px` }}
                className="object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" 
              />
            ) : (
              <div className="flex items-center gap-1 group">
                <span className="bg-gold text-black size-6 rounded-full flex items-center justify-center font-black shadow-[0_0_10px_rgba(212,175,55,0.3)] text-[10px] leading-none"><span className="relative" style={{ top: '-0.5px' }}>{siteConfig?.name?.charAt(0) || 'L'}</span></span>
                <span className="gold-text-gradient uppercase font-black tracking-tighter">{siteConfig?.name || 'Leilão'}</span>
              </div>
            )}
          </Link>

          <div className="hidden lg:flex items-center gap-8 text-[12px] font-black uppercase tracking-[0.2em] text-white/90">
            <Link to="/" className="hover:text-gold transition-colors">Leilões</Link>
            <Link to="/" hash="categorias" className="hover:text-gold transition-colors">Categorias</Link>
            <Link to="/como-funciona" className="hover:text-gold transition-colors">Como Funciona</Link>
            <Link to="/contato" className="hover:text-gold transition-colors">Contatos</Link>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center relative group">
            <Search className="absolute left-3 w-3.5 h-3.5 text-white/40" />
            <input 
              type="text" 
              placeholder="Pesquisar lotes..."
              className="rounded-xl pl-9 pr-4 py-2 text-[11px] w-40 bg-white/5 placeholder:text-white/20 border border-white/10 focus:border-gold/50 text-white outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-1 md:gap-3">
            {user && <NotificationBell />}
            
            {isAdmin && (
              <Link to="/admin" className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition-all shadow-lg hover:scale-105 active:scale-95">
                <Settings className="size-4" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Admin</span>
              </Link>
            )}

            <Link to={user ? "/painel" : "/entrar"} className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-black hover:bg-gold transition-all shadow-lg hover:scale-105 active:scale-95">
              <User className="size-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">{user ? 'Painel' : 'Entrar'}</span>
            </Link>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10 rounded-xl">
                  <Menu className="size-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-brand-950 border-brand-800 p-8 flex flex-col gap-10">
                <div className="flex flex-col gap-6 mt-12">
                  {isAdmin && (
                    <Link to="/admin" className="text-lg font-black uppercase tracking-widest text-brand-500 hover:text-gold transition-colors border-b border-white/5 pb-4 flex items-center gap-3">
                      <Settings className="size-5" />
                      Painel Admin
                    </Link>
                  )}
                  <Link to="/" className="text-lg font-black uppercase tracking-widest text-white hover:text-gold transition-colors border-b border-white/5 pb-4">Leilões</Link>
                  <Link to="/" hash="categorias" className="text-lg font-black uppercase tracking-widest text-white hover:text-gold transition-colors border-b border-white/5 pb-4">Categorias</Link>
                  <Link to="/como-funciona" className="text-lg font-black uppercase tracking-widest text-white hover:text-gold transition-colors border-b border-white/5 pb-4">Como Funciona</Link>
                  <Link to="/contato" className="text-lg font-black uppercase tracking-widest text-white hover:text-gold transition-colors border-b border-white/5 pb-4">Contatos</Link>
                </div>
                
                <Link to={user ? "/painel" : "/entrar"} className="mt-auto flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-xs">
                  <User className="size-5" />
                  {user ? 'Acessar Painel' : 'Fazer Login'}
                </Link>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </>
  );
}
