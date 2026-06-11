import { Link } from '@tanstack/react-router';
import { Globe, MessageCircle, Send, Play, Mail, Phone, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SmartImage } from '../SmartImage';

export function SiteFooter() {
  const [siteConfig, setSiteConfig] = useState<any>(null);

  useEffect(() => {
    const fetchSiteConfig = async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'site_config')
        .maybeSingle();
      
      if (!error && data) {
        setSiteConfig(data.value);
      }
    };
    fetchSiteConfig();
  }, []);
  return (
    <footer className="bg-brand-950 text-white pt-24 pb-12 px-4 lg:px-12 border-t border-brand-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
        <div className="space-y-6">
          <Link to="/" className="text-2xl font-black tracking-tighter block">
            {siteConfig?.logo_url ? (
              <SmartImage 
                src={siteConfig.logo_url} 
                alt={siteConfig.name} 
                style={{ height: `${(siteConfig.logo_height || 40) * 1.5}px` }} 
                className="object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.3)] filter brightness-110" 
              />
            ) : (
              <div className="flex items-center gap-1 group">
                <span className="bg-gold text-black size-8 rounded-full flex items-center justify-center font-black shadow-[0_0_15px_rgba(212,175,55,0.4)] group-hover:scale-110 transition-transform text-base leading-none"><span className="relative" style={{ top: '-0.5px' }}>{siteConfig?.name?.charAt(0) || 'L'}</span></span>
                <span className="gold-text-gradient uppercase font-black tracking-tighter text-2xl drop-shadow-sm">{siteConfig?.name || 'Leilão'}</span>
              </div>
            )}
          </Link>

          <p className="text-white/40 text-sm leading-relaxed max-w-xs">
            A plataforma de leilões mais exclusiva do Brasil. Tecnologia de ponta, segurança jurídica e curadoria premium para seus investimentos.
          </p>
          <div className="flex gap-4">
            {siteConfig?.instagram_url && (
              <a href={siteConfig.instagram_url} target="_blank" rel="noopener noreferrer" className="size-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] hover:text-white transition-all">
                <Globe className="w-4 h-4" />
              </a>
            )}
            {siteConfig?.facebook_url && (
              <a href={siteConfig.facebook_url} target="_blank" rel="noopener noreferrer" className="size-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-all">
                <Globe className="w-4 h-4" />
              </a>
            )}
            <a 
              href={`https://wa.me/${siteConfig?.whatsapp?.replace(/\D/g, '') || siteConfig?.phone?.replace(/\D/g, '') || '5511999999999'}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="size-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            {siteConfig?.twitter_url && (
              <a href={siteConfig.twitter_url} target="_blank" rel="noopener noreferrer" className="size-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                <Send className="w-4 h-4" />
              </a>
            )}
            {siteConfig?.youtube_url && (
              <a href={siteConfig.youtube_url} target="_blank" rel="noopener noreferrer" className="size-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-[#FF0000] hover:text-white transition-all">
                <Play className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Plataforma</h3>
          <ul className="space-y-4">
            <li><a href="/" className="text-sm text-white/40 hover:text-white transition-colors">Leilões Ativos</a></li>
            <li><a href="/" className="text-sm text-white/40 hover:text-white transition-colors">Próximos Eventos</a></li>
            <li><Link to="/" hash="categorias" className="text-sm text-white/40 hover:text-white transition-colors">Categorias</Link></li>
            <li><Link to="/" hash="resultados" className="text-sm text-white/40 hover:text-white transition-colors">Resultados</Link></li>
            <li><Link to="/como-funciona" className="text-sm text-white/40 hover:text-white transition-colors">Como Funciona</Link></li>
            <li><Link to="/contato" className="text-sm text-white/40 hover:text-white transition-colors">FAQ</Link></li>
          </ul>
        </div>

        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Institucional</h3>
          <ul className="space-y-4">
            <li><Link to="/sobre" className="text-sm text-white/40 hover:text-white transition-colors">Sobre Nós</Link></li>
            <li><Link to="/termos" className="text-sm text-white/40 hover:text-white transition-colors">Termos de Uso</Link></li>
            <li><Link to="/privacidade" className="text-sm text-white/40 hover:text-white transition-colors">Política de Privacidade</Link></li>
            <li><Link to="/seguranca" className="text-sm text-white/40 hover:text-white transition-colors">Segurança</Link></li>
            <li><Link to="/contato" className="text-sm text-white/40 hover:text-white transition-colors">Contato</Link></li>
          </ul>
        </div>

        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Atendimento</h3>
          <ul className="space-y-4">
            <li className="flex items-center gap-3 text-sm text-white/40">
              <Phone className="w-4 h-4 text-brand-600" />
              {siteConfig?.phone || '0800 123 4567'}
            </li>
            <li className="flex items-center gap-3 text-sm text-white/40">
              <Mail className="w-4 h-4 text-brand-600" />
              {siteConfig?.email || 'suporte@empresa.com.br'}
            </li>
            <li className="flex items-center gap-3 text-sm text-white/40">
              <MapPin className="w-4 h-4 text-brand-600" />
              {siteConfig?.address || 'Av. Paulista, 1000 - SP'}
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="text-[8px] font-black text-green-500/80 uppercase tracking-widest italic">Servidor Online • Auditoria em Tempo Real</span>
            </div>
            <div className="flex flex-col items-center md:items-start gap-1">
              <p className="text-[7px] font-black text-gold/60 uppercase tracking-[0.2em]">
                {siteConfig?.name || 'Leilão'}
              </p>
              <p className="text-[8px] text-white/20 font-medium tracking-widest">
                © 2025 TODOS OS DIREITOS RESERVADOS
              </p>
              <p className="text-[6px] text-white/10 font-medium tracking-widest mt-0.5">
                Deploy automático ✅
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center md:justify-end items-center gap-6">
             <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-all group">
               <span className="text-[8px] font-black uppercase text-white/50 tracking-widest group-hover:text-white/80 transition-colors">Google Safe Browsing</span>
             </div>

             <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-all group">
               <span className="text-[8px] font-black uppercase text-white/50 tracking-widest group-hover:text-white/80 transition-colors">PIX</span>
             </div>
             
             <div className="h-4 w-px bg-white/10 hidden md:block" />

             <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-all group">
               <span className="text-[8px] font-black uppercase text-white/50 tracking-widest group-hover:text-white/80 transition-colors">SSL 256-bit Secure</span>
             </div>

             <div className="flex items-center gap-2 group cursor-pointer px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-[7px] font-black uppercase text-white/60 tracking-widest">Site Blindado</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="size-1 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[6px] font-bold text-green-500/90 uppercase tracking-[0.2em]">100% Seguro</span>
                  </div>
                </div>
              </div>
          </div>
      </div>
    </footer>
  );
}
