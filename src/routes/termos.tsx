import { createFileRoute } from '@tanstack/react-router';
import { DynamicInstitutionalPage } from '@/components/leilao/DynamicInstitutionalPage';

export const Route = createFileRoute('/termos')({
  component: TermsPage,
});

function TermsPage() {
  return (
    <DynamicInstitutionalPage 
      title="Termos de Uso" 
      contentKey="page_terms" 
      defaultContent={
        <>
          <p className="text-sm text-brand-400">Última atualização: Maio de 2024</p>
          
          <h2 className="text-xl font-black text-white uppercase italic mt-8 mb-4">1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e utilizar a plataforma MAURÍCIO LEILÕES, você concorda expressamente com os termos e 
            condições aqui estabelecidos. O cadastro na plataforma implica na leitura e aceitação total 
            destas regras.
          </p>

          <h2 className="text-xl font-black text-white uppercase italic mt-8 mb-4">2. Habilitação para Lances</h2>
          <p>
            Para participar de nossos leilões, o usuário deve ser maior de 18 anos e possuir cadastro 
            aprovado. Em determinados eventos, será exigida a confirmação de caução prévia conforme o 
            valor estipulado em edital.
          </p>

          <h2 className="text-xl font-black text-white uppercase italic mt-8 mb-4">3. Responsabilidades do Arrematante</h2>
          <p>
            O arrematante é responsável pela veracidade dos dados informados e pelo pagamento integral do 
            lote arrematado, acrescido da comissão do leiloeiro e taxas administrativas, conforme 
            especificado em cada lote.
          </p>

          <h2 className="text-xl font-black text-white uppercase italic mt-8 mb-4">4. Cancelamento de Lances</h2>
          <p>
            Lances realizados não podem ser cancelados. O sistema de auditoria registra cada oferta com 
            selo de autenticidade, garantindo a lisura do processo.
          </p>
        </>
      }
    />
  );
}
