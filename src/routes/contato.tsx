import { createFileRoute } from '@tanstack/react-router';
import { DynamicInstitutionalPage } from '@/components/leilao/DynamicInstitutionalPage';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/contato')({
  component: ContactPage,
});

function ContactPage() {
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

  const whatsappNumber = siteConfig?.whatsapp?.replace(/\D/g, '') || siteConfig?.phone?.replace(/\D/g, '') || "5511999999999";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Olá! Gostaria de falar com a equipe de suporte.`;

  return (
    <DynamicInstitutionalPage 
      title="Contato" 
      contentKey="page_contact"
      type="faq"
      faqData={[
        { question: "Como faço para dar um lance?", answer: "Para dar um lance, você precisa estar cadastrado e logado na plataforma. Acesse o lote desejado e clique no botão de lance." },
        { question: "O que é a caução?", answer: "A caução é uma garantia financeira necessária para participar de alguns leilões. O valor é reembolsável caso você não arremate nenhum lote." },
        { question: "Como recebo meu produto?", answer: "Após o arremate e pagamento, entraremos em contato para organizar a retirada ou envio do item." }
      ]}
      defaultContent={
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-black text-white uppercase italic mb-6">Fale Conosco</h2>
              <p className="text-brand-300">
                Nossa equipe de especialistas está à disposição para tirar suas dúvidas sobre lotes, 
                habilitação e processos de arremate.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-brand-900 border border-brand-800 flex items-center justify-center shrink-0">
                  <Phone className="size-5 text-gold" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Telefone</p>
                  <p className="text-white font-bold">{siteConfig?.phone || '0800 123 4567'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-brand-900 border border-brand-800 flex items-center justify-center shrink-0">
                  <Mail className="size-5 text-gold" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest">E-mail</p>
                  <p className="text-white font-bold">{siteConfig?.email || 'atendimento@mauricioleiloes.com.br'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-brand-900 border border-brand-800 flex items-center justify-center shrink-0">
                  <MapPin className="size-5 text-gold" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Escritório</p>
                  <p className="text-white font-bold">{siteConfig?.address || 'Av. Paulista, 1000 - São Paulo, SP'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-brand-900/60 p-8 rounded-[2rem] border border-brand-800 space-y-6 flex flex-col items-center justify-center text-center">
            <div className="size-20 bg-[#25D366]/20 rounded-full flex items-center justify-center shadow-glow-green mb-4">
              <MessageCircle className="size-10 text-[#25D366]" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic">Atendimento via WhatsApp</h3>
            <p className="text-brand-300 text-sm max-w-xs">
              Prefere uma conversa rápida? Nossa equipe de atendimento está online agora para te ajudar.
            </p>
            <Button 
              className="w-full h-14 bg-[#25D366] hover:bg-[#1eb954] text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_4px_20px_rgba(37,211,102,0.3)] transition-all group border-none"
              onClick={() => window.open(whatsappUrl, '_blank')}
            >
              <MessageCircle className="mr-2 group-hover:animate-bounce" />
              Iniciar Conversa
            </Button>
            <p className="text-[10px] text-brand-500 font-black uppercase tracking-[0.2em]">Tempo médio de resposta: 5 min</p>
          </div>
        </div>
      }
    />
  );
}

