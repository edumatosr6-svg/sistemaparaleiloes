import { createFileRoute } from '@tanstack/react-router';
import { DynamicInstitutionalPage } from '@/components/leilao/DynamicInstitutionalPage';
import { ShieldCheck, Lock, Globe, Database } from 'lucide-react';

export const Route = createFileRoute('/seguranca')({
  component: SecurityPage,
});

function SecurityPage() {
  return (
    <DynamicInstitutionalPage 
      title="Segurança" 
      contentKey="page_security" 
      defaultContent={
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            <div className="bg-brand-950/40 p-6 rounded-3xl border border-brand-800 space-y-4">
              <ShieldCheck className="size-10 text-gold" />
              <h3 className="text-lg font-black text-white uppercase italic">Auditoria em Tempo Real</h3>
              <p className="text-sm text-brand-300">Cada lance é registrado com timestamp e ID único, auditado por sistemas independentes.</p>
            </div>
            
            <div className="bg-brand-950/40 p-6 rounded-3xl border border-brand-800 space-y-4">
              <Lock className="size-10 text-gold" />
              <h3 className="text-lg font-black text-white uppercase italic">Transações Criptografadas</h3>
              <p className="text-sm text-brand-300">Todas as informações de caução e pagamentos utilizam protocolos SSL/TLS de nível bancário.</p>
            </div>

            <div className="bg-brand-950/40 p-6 rounded-3xl border border-brand-800 space-y-4">
              <Globe className="size-10 text-gold" />
              <h3 className="text-lg font-black text-white uppercase italic">Conexão Estável</h3>
              <p className="text-sm text-brand-300">Servidores distribuídos globalmente garantem que você nunca perca o timing de um lance.</p>
            </div>

            <div className="bg-brand-950/40 p-6 rounded-3xl border border-brand-800 space-y-4">
              <Database className="size-10 text-gold" />
              <h3 className="text-lg font-black text-white uppercase italic">Proteção de Dados</h3>
              <p className="text-sm text-brand-300">Backup contínuo e infraestrutura redundante para máxima disponibilidade do sistema.</p>
            </div>
          </div>
          
          <div className="mt-12 p-6 bg-gold/10 border border-gold/20 rounded-3xl">
            <p className="text-sm font-medium text-gold text-center">
              Nossa plataforma é testada diariamente contra vulnerabilidades para garantir a total 
              tranquilidade de nossos usuários.
            </p>
          </div>
        </>
      }
    />
  );
}
