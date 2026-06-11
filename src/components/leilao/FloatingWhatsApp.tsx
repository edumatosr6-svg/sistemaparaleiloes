import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function FloatingWhatsApp() {
  const { data: siteConfig } = useQuery({
    queryKey: ['site_config'],
    queryFn: async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'site_config')
        .maybeSingle();
      return data?.value as any;
    }
  });

  const phoneNumber = siteConfig?.whatsapp?.replace(/\D/g, '') || siteConfig?.phone?.replace(/\D/g, '') || "5511999999999";
  const message = "Olá! Gostaria de mais informações sobre os leilões.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-24 right-6 z-50 bg-[#25D366] text-white size-14 md:size-16 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:shadow-[0_8px_30px_rgba(37,211,102,0.6)] transition-all duration-300 group"
    >
      <MessageCircle className="size-8 md:size-10 group-hover:animate-pulse" />
      <div className="absolute right-full mr-4 bg-white text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl pointer-events-none border border-slate-100 hidden md:block">
        Atendimento Rápido
      </div>
    </motion.a>
  );
}
