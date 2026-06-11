import { createFileRoute } from '@tanstack/react-router';
import { DynamicInstitutionalPage } from '@/components/leilao/DynamicInstitutionalPage';

export const Route = createFileRoute('/privacidade')({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <DynamicInstitutionalPage 
      title="Política de Privacidade" 
      contentKey="page_privacy" 
      defaultContent={
        <>
          <p className="text-sm text-brand-400">Em conformidade com a LGPD (Lei Geral de Proteção de Dados)</p>

          <h2 className="text-xl font-black text-white uppercase italic mt-8 mb-4">Coleta de Dados</h2>
          <p>
            Coletamos apenas as informações necessárias para a realização segura dos leilões e 
            identificação dos licitantes, incluindo nome, CPF/CNPJ, endereço e informações de contato.
          </p>

          <h2 className="text-xl font-black text-white uppercase italic mt-8 mb-4">Uso das Informações</h2>
          <p>
            Seus dados são utilizados exclusivamente para processamento de lances, faturamento de lotes 
            arrematados e comunicações oficiais sobre os eventos da plataforma.
          </p>

          <h2 className="text-xl font-black text-white uppercase italic mt-8 mb-4">Segurança</h2>
          <p>
            Utilizamos criptografia de ponta a ponta e auditoria externa para garantir que suas 
            informações pessoais e financeiras estejam sempre protegidas contra acessos não autorizados.
          </p>

          <h2 className="text-xl font-black text-white uppercase italic mt-8 mb-4">Seus Direitos</h2>
          <p>
            Você tem o direito de solicitar a alteração ou exclusão de seus dados, conforme previsto na 
            legislação vigente, desde que não existam pendências financeiras ou obrigações contratuais 
            em aberto.
          </p>
        </>
      }
    />
  );
}
