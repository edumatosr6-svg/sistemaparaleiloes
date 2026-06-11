import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function PerformanceMonitor() {
  const { user } = useAuth();

  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;

    const reportMetric = async (name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor') => {
      if (rating === 'good') return;

      // system_logs RLS only allows authenticated admins to insert; skip for anon visitors
      // to avoid spurious 401s in the browser console.
      if (!user) return;

      // console.warn removed per user request

      // Log to system_logs for admin review
      try {
        await supabase.from('system_logs').insert({
          level: rating === 'poor' ? 'error' : 'warning',
          message: `Queda de Performance detectada: ${name}`,
          context: {
            metric: name,
            value: value,
            rating: rating,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        });
      } catch (err) {
        console.error('Error logging performance metric:', err);
      }

      // Toast notifications removed per user request

    };

    // LCP Monitor
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      const value = lastEntry.startTime;
      const rating = value > 4000 ? 'poor' : value > 2500 ? 'needs-improvement' : 'good';
      reportMetric('LCP', value, rating);
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // CLS Monitor
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      const rating = clsValue > 0.25 ? 'poor' : clsValue > 0.1 ? 'needs-improvement' : 'good';
      if (rating !== 'good') reportMetric('CLS', clsValue, rating);
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // INP (Interaction to Next Paint) / Long Animation Frames approximation
    const longTaskObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.duration > 200) {
          reportMetric('LongTask', entry.duration, 'poor');
        }
      }
    });
    longTaskObserver.observe({ type: 'longtask' });

    return () => {
      lcpObserver.disconnect();
      clsObserver.disconnect();
      longTaskObserver.disconnect();
    };
  }, [user]);

  return null;
}
