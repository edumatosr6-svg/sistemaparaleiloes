import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/sitemap/xml')({
  component: SitemapComponent,
});

function SitemapComponent() {
  const [xml, setXml] = useState('');

  useEffect(() => {
    async function generateSitemap() {
      const baseUrl = window.location.origin;

      // Fetch lots
      const { data: lots } = await supabase
        .from('lots')
        .select('id, title, image_url, updated_at')
        .eq('status', 'active');

      // Fetch categories
      const { data: categories } = await supabase
        .from('categories')
        .select('slug');

      // Fetch auctions
      const { data: auctions } = await supabase
        .from('auctions')
        .select('id, title, image_url, updated_at')
        .eq('status', 'active');

      const staticPages = [
        '',
        '/sobre',
        '/contato',
        '/como-funciona',
        '/privacidade',
        '/seguranca',
        '/termos',
        '/entrar',
        '/painel'
      ];

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${staticPages.map(page => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>${page === '' ? 'daily' : 'monthly'}</changefreq>
    <priority>${page === '' ? '1.0' : '0.5'}</priority>
  </url>`).join('')}
  ${(auctions || []).map(auction => `
  <url>
    <loc>${baseUrl}/leilao/${auction.id}</loc>
    <lastmod>${new Date(auction.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
    ${auction.image_url ? `
    <image:image>
      <image:loc>${auction.image_url}</image:loc>
      <image:title>${auction.title || 'Leilão'}</image:title>
    </image:image>` : ''}
  </url>`).join('')}
  ${(lots || []).map(lot => `
  <url>
    <loc>${baseUrl}/lote/${lot.id}</loc>
    <lastmod>${new Date(lot.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
    ${lot.image_url ? `
    <image:image>
      <image:loc>${lot.image_url}</image:loc>
      <image:title>${lot.title || 'Lote'}</image:title>
    </image:image>` : ''}
  </url>`).join('')}
  ${(categories || []).map(cat => `
  <url>
    <loc>${baseUrl}/categoria/${cat.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`;
      setXml(sitemap);
    }
    generateSitemap();
  }, []);

  return (
    <pre className="p-4 bg-slate-900 text-green-400 overflow-auto h-screen text-xs">
      {xml}
    </pre>
  );
}
