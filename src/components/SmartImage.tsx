import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackAlt?: string;
}

export function SmartImage({ fallbackAlt, alt, ...props }: SmartImageProps) {
  const { data: settings } = useQuery({
    queryKey: ['system-settings-seo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
      
      if (error) throw error;
      
      const config: any = {};
      data?.forEach(item => {
        if (item.key === 'site_config') {
          Object.assign(config, item.value);
        } else {
          config[item.key] = item.value;
        }
      });
      return config;
    }
  });

  const mainKeyword = settings?.seo_main_keyword || '';
  const finalAlt = alt || `${fallbackAlt || ''} ${mainKeyword}`.trim() || 'Imagem do leilão';

  return <img alt={finalAlt} {...props} />;
}
