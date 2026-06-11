import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Trophy, Gavel, Wallet, Info } from 'lucide-react';
import React from 'react';

export function NotificationListener() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as any;
          
          let Icon = Info;
          if (notification.type === 'won') Icon = Trophy;
          if (notification.type === 'outbid') Icon = Gavel;
          if (notification.type === 'payment') Icon = Wallet;

          toast(notification.title, {
            description: notification.message,
            icon: <Icon className="size-5 text-amber-500" />,
            duration: 10000,
            action: notification.link ? {
              label: 'Ver',
              onClick: () => window.location.href = notification.link
            } : undefined
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null;
}
