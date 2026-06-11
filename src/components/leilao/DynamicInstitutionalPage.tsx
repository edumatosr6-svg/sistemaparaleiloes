import { InstitutionalLayout } from './InstitutionalLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '../SEO';

interface DynamicInstitutionalPageProps {
  title: string;
  contentKey: string;
  defaultContent: React.ReactNode;
  type?: 'article' | 'faq';
  faqData?: Array<{ question: string; answer: string }>;
  breadcrumbs?: Array<{ name: string; item: string }>;
}

export function DynamicInstitutionalPage({ title, contentKey, defaultContent, type = 'article', faqData, breadcrumbs }: DynamicInstitutionalPageProps) {
  const { data: content, isLoading } = useQuery({
    queryKey: ['page_content', contentKey],
    queryFn: async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', contentKey)
        .maybeSingle();
      return data?.value as string;
    }
  });

  const finalBreadcrumbs = breadcrumbs || [
    { name: 'Início', item: '/' },
    { name: title, item: window.location.pathname }
  ];

  return (
    <InstitutionalLayout title={title}>
      <SEO 
        title={title} 
        type={type} 
        faqData={faqData} 
        breadcrumbs={finalBreadcrumbs}
      />
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-brand-800 rounded w-3/4" />
          <div className="h-4 bg-brand-800 rounded w-full" />
          <div className="h-4 bg-brand-800 rounded w-5/6" />
        </div>
      ) : content ? (
        <div className="prose prose-invert prose-brand max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        defaultContent
      )}
    </InstitutionalLayout>
  );
}
