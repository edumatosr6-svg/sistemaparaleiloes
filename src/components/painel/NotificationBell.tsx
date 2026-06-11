import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: count = 0 } = useQuery({
    queryKey: ['unread-notifications-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`unread-notifications-count-refresh:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['unread-notifications-count', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return (
    <Link to="/painel/notificacoes">
      <Button variant="ghost" size="icon" className="rounded-full text-white/60 hover:bg-white/5 relative">
        <Bell className="size-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-[20px] h-5 items-center justify-center rounded-full bg-gold text-[10px] font-black text-black border-2 border-brand-950 shadow-lg z-10 px-1 leading-none transition-all">
            <span className="relative" style={{ top: '-0.5px' }}>{count > 9 ? '9+' : count}</span>
          </span>
        )}
      </Button>
    </Link>
  );
}