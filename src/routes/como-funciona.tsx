import { createFileRoute, Link } from '@tanstack/react-router';
import { DynamicInstitutionalPage } from '@/components/leilao/DynamicInstitutionalPage';
import { ShieldCheck, Gavel, Trophy, CheckCircle2, CreditCard, UserPlus, Search, MessageCircle, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

export const Route = createFileRoute('/como-funciona')({
  component: HowItWorksPage,
});

function HowItWorksPage() {
  const steps = [
    {
      title: "Habilitação",
      desc: "Cadastre-se na plataforma preenchendo seus dados básicos. É rápido, seguro e gratuito.",
      icon: UserPlus,
      color: "blue"
    },
    {
      title: "Escolha o Lote",
      desc: "Navegue por nosso catálogo premium e encontre o item perfeito para sua coleção ou investimento.",
      icon: Search,
      color: "amber"
    },
    {
      title: "Depósito de Caução",
      desc: "Para garantir a seriedade das disputas, alguns leilões exigem um depósito de caução reembolsável.",
      icon: CreditCard,
      color: "gold",
      highlight: true
    },
    {
      title: "Dê seu Lance",
      desc: "Participe das disputas ao vivo ou simultâneas. Nosso sistema audita cada lance em tempo real.",
      icon: Gavel,
      color: "red"
    },
    {
      title: "Arremate",
      desc: "Seja o maior lance quando o cronômetro zerar ou o leiloeiro bater o martelo.",
      icon: Trophy,
      color: "green"
    },
    {
      title: "Recebimento",
      desc: "Após o pagamento, cuidamos de toda a logística para que seu item chegue com segurança.",
      icon: CheckCircle2,
      color: "brand"
    }
  ];

  return (
    <DynamicInstitutionalPage 
      title="Como Funciona" 
      contentKey="page_how_it_works"
      defaultContent={
        <div className="space-y-16">
          <section className="text-center max-w-2xl mx-auto space-y-4">
            <p className="text-lg text-brand-300 leading-relaxed italic">
              Participar dos leilões da Mega Leilões Hot Toys é simples, seguro e transparente. 
              Siga os passos abaixo para iniciar sua jornada de arremates.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-8 rounded-[3rem] bg-brand-900/60 border ${step.highlight ? 'border-gold shadow-[0_0_30px_rgba(212,175,55,0.15)] scale-[1.02]' : 'border-brand-800'} space-y-6 group transition-all hover:border-gold/30`}
              >
                <div className={`size-16 rounded-2xl flex items-center justify-center bg-brand-800 border border-brand-700 shadow-xl transition-colors group-hover:bg-gold`}>
                  <step.icon className="size-8 text-gold group-hover:text-black transition-colors" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="size-6 rounded-full bg-brand-800 text-brand-400 flex items-center justify-center text-[10px] font-black border border-brand-700">
                      0{i + 1}
                    </span>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tight group-hover:text-gold transition-colors">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-brand-300 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                {step.highlight && (
                  <div className="pt-4 border-t border-brand-800/50 flex items-center gap-3">
                    <div className="size-10 rounded-full bg-gold/10 flex items-center justify-center">
                      <ShieldCheck className="size-5 text-gold" />
                    </div>
                    <p className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">
                      Foco na Segurança do Arrematante
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* New Detailed Sections */}
          <section className="space-y-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-800 border border-brand-700">
                  <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-300">Passo 1: Cadastro & Perfil</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase leading-none">
                  Como se <span className="text-gold">Cadastrar</span>
                </h2>
                <p className="text-brand-300 leading-relaxed text-lg">
                  O primeiro passo é criar sua conta. Clique no botão "Entrar" no menu superior e escolha a opção de cadastro. 
                  Você precisará preencher seus dados pessoais e anexar fotos dos seus documentos (RG/CNH e Comprovante de Residência) 
                  para garantir a segurança de todos os participantes.
                </p>
                <ul className="space-y-4">
                  {[
                    "Preencha o formulário completo",
                    "Valide seu e-mail e telefone",
                    "Envie fotos nítidas dos documentos",
                    "Aguarde a aprovação da nossa equipe"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-brand-400 font-bold uppercase text-xs tracking-widest">
                      <CheckCircle2 className="size-5 text-gold" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative group">
                <div className="absolute -inset-4 bg-gold/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-brand-900 rounded-3xl border border-brand-800 overflow-hidden shadow-premium">
                  <div className="bg-brand-800 p-4 border-b border-brand-700 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <div className="size-3 rounded-full bg-red-500/50" />
                      <div className="size-3 rounded-full bg-amber-500/50" />
                      <div className="size-3 rounded-full bg-green-500/50" />
                    </div>
                    <div className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Painel de Cadastro</div>
                  </div>
                  <div className="p-8 space-y-6 opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                    <div className="h-10 bg-brand-800 rounded-lg w-full" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-10 bg-brand-800 rounded-lg" />
                      <div className="h-10 bg-brand-800 rounded-lg" />
                    </div>
                    <div className="h-24 bg-brand-800/50 rounded-lg border-2 border-dashed border-brand-700 flex flex-col items-center justify-center gap-2">
                      <UserPlus className="size-6 text-brand-600" />
                      <span className="text-[10px] font-black text-brand-600 uppercase">Anexar Documento</span>
                    </div>
                    <div className="h-12 bg-gold rounded-full w-full" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative group">
                <div className="absolute -inset-4 bg-brand-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-brand-900 rounded-3xl border border-brand-800 overflow-hidden shadow-premium">
                  <div className="bg-brand-800 p-4 border-b border-brand-700 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <div className="size-3 rounded-full bg-red-500/50" />
                      <div className="size-3 rounded-full bg-amber-500/50" />
                      <div className="size-3 rounded-full bg-green-500/50" />
                    </div>
                    <div className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Página do Lote</div>
                  </div>
                  <div className="p-8 space-y-4 opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                    <div className="aspect-video bg-brand-800 rounded-xl overflow-hidden relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Gavel className="size-12 text-brand-700" />
                      </div>
                      <div className="absolute top-4 right-4 bg-red-600 px-3 py-1 rounded-full text-[10px] font-black text-white animate-pulse">AO VIVO</div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="space-y-2">
                        <div className="h-4 bg-brand-800 rounded w-32" />
                        <div className="h-8 bg-brand-700 rounded w-48" />
                      </div>
                      <div className="size-14 rounded-2xl bg-gold flex items-center justify-center shadow-glow-gold">
                        <Gavel className="size-6 text-black" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-800 border border-brand-700">
                  <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-300">Passo 2: Habilitação & Caução</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase leading-none">
                  Habilite-se para <span className="text-gold">Licitado</span>
                </h2>
                <p className="text-brand-300 leading-relaxed text-lg">
                  Para participar das disputas, você precisa se habilitar em cada leilão. 
                  Em alguns casos, é exigido um <strong>Depósito de Caução</strong>. 
                  Este valor é uma garantia e será 100% devolvido caso você não arremate nenhum lote. 
                  O pagamento é feito via PIX para garantir habilitação instantânea.
                </p>
                <div className="p-6 rounded-2xl bg-brand-800/40 border border-brand-700 border-l-4 border-l-gold space-y-2">
                  <p className="text-xs font-black text-gold uppercase tracking-widest">Por que a caução?</p>
                  <p className="text-sm text-brand-400">
                    A caução protege o leilão de lances falsos e garante que todos os arrematantes honrarão seus compromissos, 
                    mantendo o ecossistema saudável para investidores sérios.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-800 border border-brand-700">
                  <span className="size-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-300">Passo 3: Arremate & Pagamento</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase leading-none">
                  Venci o Leilão! <span className="text-gold">E agora?</span>
                </h2>
                <p className="text-brand-300 leading-relaxed text-lg">
                  Parabéns! Após o arremate, você receberá uma notificação em tempo real. 
                  O Auto de Arrematação estará disponível em seu painel. 
                  O pagamento deve ser efetuado em até 24h úteis via transferência bancária ou PIX conforme instruções na Nota de Venda.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-brand-900 border border-brand-800 space-y-2">
                    <CreditCard className="size-6 text-gold" />
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Pagamento do Lote</p>
                    <p className="text-[9px] text-brand-500">Valor do lance + Comissão</p>
                  </div>
                  <div className="p-4 rounded-xl bg-brand-900 border border-brand-800 space-y-2">
                    <CheckCircle2 className="size-6 text-green-500" />
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Confirmação</p>
                    <p className="text-[9px] text-brand-500">Envio do comprovante via painel</p>
                  </div>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-4 bg-green-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-brand-900 rounded-3xl border border-brand-800 overflow-hidden shadow-premium">
                  <div className="bg-brand-800 p-4 border-b border-brand-700 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <div className="size-3 rounded-full bg-red-500/50" />
                      <div className="size-3 rounded-full bg-amber-500/50" />
                      <div className="size-3 rounded-full bg-green-500/50" />
                    </div>
                    <div className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Meu Painel - Financeiro</div>
                  </div>
                  <div className="p-8 space-y-4">
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-green-500 flex items-center justify-center">
                          <Trophy className="size-5 text-black" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-white uppercase tracking-widest">Lote Arrematado</p>
                          <p className="text-[9px] text-green-500 font-bold uppercase tracking-widest">Aguardando Pagamento</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-white text-black text-[9px] font-black rounded-lg uppercase tracking-widest">Pagar Agora</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-20 p-10 md:p-16 rounded-[4rem] bg-gradient-to-br from-brand-900/80 to-brand-950 border border-brand-800 relative overflow-hidden text-center space-y-12">
            <div className="absolute top-0 right-0 p-12 opacity-5">
              <ShieldCheck className="size-48" />
            </div>
            <div className="relative z-10 space-y-8">
              <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter">Canais de Contendimento</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-8 rounded-3xl bg-brand-950/50 border border-brand-800 space-y-4 hover:border-gold/30 transition-all">
                  <div className="size-14 rounded-2xl bg-brand-800 flex items-center justify-center mx-auto">
                    <MessageCircle className="size-7 text-gold" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Suporte via WhatsApp</h3>
                  <p className="text-brand-400 text-sm">Dúvidas rápidas sobre lotes e habilitação em tempo real.</p>
                  <button className="text-xs font-black text-gold uppercase tracking-widest hover:underline">Falar Agora</button>
                </div>
                <div className="p-8 rounded-3xl bg-brand-950/50 border border-brand-800 space-y-4 hover:border-gold/30 transition-all">
                  <div className="size-14 rounded-2xl bg-brand-800 flex items-center justify-center mx-auto">
                    <Mail className="size-7 text-gold" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Atendimento E-mail</h3>
                  <p className="text-brand-400 text-sm">Para questões contratuais, envio de documentos e suporte técnico.</p>
                  <button className="text-xs font-black text-gold uppercase tracking-widest hover:underline">Enviar E-mail</button>
                </div>
                <div className="p-8 rounded-3xl bg-brand-950/50 border border-brand-800 space-y-4 hover:border-gold/30 transition-all">
                  <div className="size-14 rounded-2xl bg-brand-800 flex items-center justify-center mx-auto">
                    <Phone className="size-7 text-gold" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Central 0800</h3>
                  <p className="text-brand-400 text-sm">Atendimento telefônico em horário comercial para maior comodidade.</p>
                  <button className="text-xs font-black text-gold uppercase tracking-widest hover:underline">Ligar para Nós</button>
                </div>
              </div>
            </div>
          </section>

          <section className="text-center space-y-10 py-10">
            <h2 className="text-3xl font-black text-white uppercase italic">Comece hoje mesmo sua coleção de luxo</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-16 px-12 rounded-full bg-gold text-black font-black uppercase tracking-widest text-xs shadow-glow-gold hover:bg-gold-light transition-all"
              >
                Cadastrar-se Gratuitamente
              </motion.button>
              <Link to="/" className="text-brand-500 font-bold uppercase tracking-widest text-[10px] hover:text-gold transition-colors">
                Ou explore os <span className="text-gold underline underline-offset-4">leilões ativos</span>
              </Link>
            </div>
          </section>
        </div>
      }
    />
  );
}

