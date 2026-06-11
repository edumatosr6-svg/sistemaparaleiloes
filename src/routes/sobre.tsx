import { createFileRoute } from '@tanstack/react-router';
import { DynamicInstitutionalPage } from '@/components/leilao/DynamicInstitutionalPage';

export const Route = createFileRoute('/sobre')({
  component: AboutPage,
});

function AboutPage() {
  return (
    <DynamicInstitutionalPage 
      title="Sobre Nós" 
      contentKey="page_about" 
      defaultContent={
        <>
          <p>
            A MAURÍCIO LEILÕES nasceu com o propósito de transformar o mercado de arremates premium no Brasil. 
            Com décadas de experiência em curadoria de itens exclusivos, nossa plataforma une a tradição do 
            martelo com a mais alta tecnologia de transmissão simultânea.
          </p>
          <h2 className="text-2xl font-black text-white uppercase italic mt-8 mb-4">Nossa Missão</h2>
          <p>
            Proporcionar segurança jurídica, transparência total e uma experiência de luxo para investidores 
            e colecionadores em todo o território nacional.
          </p>
          <h2 className="text-2xl font-black text-white uppercase italic mt-8 mb-4">Valores</h2>
          <ul className="list-disc pl-6 space-y-2 text-brand-300">
            <li>Integridade absoluta em cada lance.</li>
            <li>Inovação tecnológica constante.</li>
            <li>Foco na satisfação do arrematante.</li>
            <li>Segurança e proteção de dados.</li>
          </ul>
        </>
      }
    />
  );
}
