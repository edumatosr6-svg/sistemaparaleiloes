import { useState, useEffect } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Menu, X, ArrowLeft, Settings, Bell, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { NotificationBell } from "./NotificationBell";
import { useAuth } from "@/hooks/useAuth";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const { data: siteConfig } = useQuery({
// ... keep existing code
    queryKey: ['site-config-dashboard'],
    queryFn: async () => {
      const { data } = await supabase.from('system_settings').select('value').eq('key', 'site_config').maybeSingle();
      return data?.value as any;
    }
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: '/entrar' } as any);
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-brand-950 gap-4">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
        <span className="text-gold font-black uppercase tracking-widest animate-pulse text-xs">
          Autenticando acesso...
        </span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Dashboard Top Header - Simple Version */}
      <header className="shrink-0 border-b border-white/5 bg-brand-950 px-6 py-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80">
            {siteConfig?.logo_url ? (
              <img 
                src={siteConfig.logo_url} 
                alt={siteConfig.name} 
                style={{ height: `32px` }}
                className="object-contain" 
              />
            ) : (
              <div className="flex items-center gap-1">
                <span className="bg-white text-black size-6 rounded-full flex items-center justify-center font-black text-[10px] uppercase shadow-[0_0_10px_rgba(255,255,255,0.3)] leading-none"><span className="relative" style={{ top: '-0.5px' }}>{siteConfig?.name?.charAt(0) || 'L'}</span></span>
                <span className="gold-text-gradient uppercase font-black tracking-tighter text-lg">{siteConfig?.name || 'Leilão'}</span>
              </div>
            )}
          </Link>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
            <div className="size-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase text-white/60 tracking-widest">Painel Protegido</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/" className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="size-3" />
            Voltar ao Site
          </Link>
          
          <div className="h-4 w-px bg-white/10 mx-2 hidden sm:block" />

          <NotificationBell />

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden rounded-xl text-white/60 hover:bg-white/5">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-brand-800 bg-brand-950">
              <DashboardSidebar />
            </SheetContent>
          </Sheet>
        </div>
      </header>
      
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block border-r border-white/5 h-full shrink-0">
          <DashboardSidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 relative">
          <div className="max-w-6xl mx-auto pb-20 lg:pb-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
