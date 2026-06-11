
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function ThemeStyles() {
  const { data: config } = useQuery({
    queryKey: ['site-theme'],
    queryFn: async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'site_config')
        .single();
      
      return (data?.value as any)?.theme || null;
    }
  });

  useEffect(() => {
    if (!config) return;

    const root = document.documentElement;
    
    // Apply theme colors to CSS variables
    if (config.background) root.style.setProperty('--background', config.background);
    if (config.surface) root.style.setProperty('--surface', config.surface);
    if (config.foreground) root.style.setProperty('--foreground', config.foreground);
    if (config.primary) root.style.setProperty('--primary', config.primary);
    if (config.accent) root.style.setProperty('--accent', config.accent);
    if (config.secondary) root.style.setProperty('--secondary', config.secondary);
    if (config.gold) {
      root.style.setProperty('--gold', config.gold);
      // Derive gold-light (simplified)
      root.style.setProperty('--gold-light', config.gold + 'CC'); // add transparency
    }
    
    // Brand scale
    if (config.brand_500) {
      root.style.setProperty('--brand-500', config.brand_500);
      root.style.setProperty('--brand-400', config.brand_500 + 'CC');
      root.style.setProperty('--brand-300', config.brand_500 + '99');
    }
    if (config.brand_600) {
      root.style.setProperty('--brand-600', config.brand_600);
      root.style.setProperty('--brand-700', config.brand_600 + 'CC');
      root.style.setProperty('--brand-800', config.brand_600 + '99');
    }
    if (config.brand_950) {
      root.style.setProperty('--brand-950', config.brand_950);
      root.style.setProperty('--brand-900', config.brand_950 + 'EE');
    }

    // Handle dark/light mode consistency if needed
    // For now, we override the root variables which are used by tailwind
    
    return () => {
      // Cleanup if necessary
    };
  }, [config]);

  return null;
}
