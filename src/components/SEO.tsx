import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { validateSchema } from '@/lib/seo-validator';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'auction' | 'article' | 'faq';
  auctionData?: {
    startDate?: string;
    endDate?: string;
    location?: string;
    status?: string;
    price?: number;
  };
  articleData?: {
    author?: string;
    datePublished?: string;
    dateModified?: string;
  };
  faqData?: Array<{
    question: string;
    answer: string;
  }>;
  breadcrumbs?: Array<{
    name: string;
    item: string;
  }>;
}

export function SEO({ title, description, image, url, type, auctionData, articleData, faqData, breadcrumbs }: SEOProps) {
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

  useEffect(() => {
    if (!settings) return;

    const keyword = settings.seo_main_keyword || 'Leilão';
    const related = settings.seo_related_keywords || '';
    const currentUrl = url || window.location.href.split('?')[0].split('#')[0];
    
    // Title
    let finalTitle = title || settings.name || 'Leilão Online';
    if (settings.seo_title_template) {
      finalTitle = settings.seo_title_template
        .replace('{title}', finalTitle)
        .replace('{keyword}', keyword);
    }
    document.title = finalTitle;

    // Description
    let finalDescription = description || 'Participe dos melhores leilões online.';
    if (settings.seo_description_template) {
      finalDescription = settings.seo_description_template.replace('{keyword}', keyword);
    }

    // Canonical Tag
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    // Meta tags update function
    const updateMeta = (name: string, content: string, property: boolean = false) => {
      const attr = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    updateMeta('description', finalDescription);
    updateMeta('keywords', `${keyword}, ${related}`);
    updateMeta('og:title', finalTitle, true);
    updateMeta('og:description', finalDescription, true);
    if (image) updateMeta('og:image', image, true);
    updateMeta('og:url', currentUrl, true);

    // Twitter Card
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', finalTitle);
    updateMeta('twitter:description', finalDescription);
    if (image) updateMeta('twitter:image', image);
    if (settings.twitter_site) updateMeta('twitter:site', settings.twitter_site);
    
    // JSON-LD Schema
    let schemas: any[] = [];
    
    // Base WebSite Schema
    const websiteSchema: any = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": settings.name || "Leilão Online",
      "url": window.location.origin,
      "description": finalDescription,
    };

    // Add Search Action only on home page
    if (window.location.pathname === '/') {
      websiteSchema.potentialAction = {
        "@type": "SearchAction",
        "target": `${window.location.origin}/auctions?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      };
    }
    schemas.push(websiteSchema);

    // Specific Schemas
    if (type === 'product' || (title && url?.includes('/lote/'))) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Product",
        "name": title,
        "image": image,
        "description": description,
        "offers": {
          "@type": "AggregateOffer",
          "url": currentUrl,
          "priceCurrency": "BRL",
          "availability": "https://schema.org/InStock"
        }
      });
    } else if (type === 'auction' || (title && url?.includes('/leilao/'))) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Auction",
        "name": title || finalTitle,
        "description": description || finalDescription,
        "image": image,
        "url": currentUrl,
        "startDate": auctionData?.startDate,
        "endDate": auctionData?.endDate,
        "location": auctionData?.location ? {
          "@type": "Place",
          "name": auctionData.location,
          "address": auctionData.location
        } : undefined,
        "eventStatus": auctionData?.status === 'active' ? "https://schema.org/EventScheduled" : "https://schema.org/EventMovedOnline",
        "offers": auctionData?.price ? {
          "@type": "Offer",
          "price": auctionData.price,
          "priceCurrency": "BRL",
          "availability": "https://schema.org/InStock",
          "url": currentUrl
        } : undefined
      });
    } else if (type === 'article') {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title || finalTitle,
        "description": description || finalDescription,
        "image": image,
        "author": {
          "@type": "Organization",
          "name": articleData?.author || settings.name || "Mega Leilões"
        },
        "datePublished": articleData?.datePublished || new Date().toISOString(),
        "dateModified": articleData?.dateModified || new Date().toISOString()
      });
    } else if (type === 'faq' && faqData) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqData.map(item => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer
          }
        }))
      });
    }

    // Breadcrumbs
    if (breadcrumbs && breadcrumbs.length > 0) {
      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": crumb.name,
          "item": crumb.item.startsWith('http') ? crumb.item : `${window.location.origin}${crumb.item}`
        }))
      };
      schemas.push(breadcrumbSchema);
    }

    // Automated Internal Validation
    schemas.forEach(schema => {
      const result = validateSchema(schema["@type"]?.toLowerCase() || '', schema);
      if (!result.isValid) {
        console.warn(`[SEO Validation Error] ${schema["@type"]}:`, result.errors);
      }
      if (result.warnings.length > 0) {
        console.info(`[SEO Validation Warning] ${schema["@type"]}:`, result.warnings);
      }
    });

    let schemaScript = document.getElementById('json-ld-schema');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'json-ld-schema';
      schemaScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(schemaScript);
    }
    schemaScript.innerHTML = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);

    // Google Site Verification
    if (settings.google_site_verification) {
      updateMeta('google-site-verification', settings.google_site_verification);
    }

    // Google Analytics
    if (settings.google_analytics_id && !document.getElementById('ga-script')) {
      const script1 = document.createElement('script');
      script1.id = 'ga-script-external';
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${settings.google_analytics_id}`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.id = 'ga-script';
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${settings.google_analytics_id}');
      `;
      document.head.appendChild(script2);
    }

    // Facebook Pixel
    if (settings.facebook_pixel_id && !document.getElementById('fb-pixel')) {
      const script = document.createElement('script');
      script.id = 'fb-pixel';
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${settings.facebook_pixel_id}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script);
    }

  }, [settings, title, description, image, url, type, auctionData, articleData, faqData, breadcrumbs]);

  return null;
}
