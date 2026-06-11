import { Bell, Gavel, Trophy, Wallet, Info, CheckCircle2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { SkeletonPremium } from "@/components/ui/skeleton-premium";
import React from 'react';

export function NotificationsSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Real-time subscription to update notifications list
  React.useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications-refresh:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: async (id?: string) => {
      if (!user?.id) return;
      if (id) {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!id) return;
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notificação excluída');
    }
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "outbid": return <Gavel className="w-5 h-5 text-red-500" />;
      case "won": return <Trophy className="w-5 h-5 text-amber-500" />;
      case "payment": return <Wallet className="w-5 h-5 text-green-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">Notificações</h1>
          <p className="text-sm text-gray-400">Mantenha-se informado sobre seus lances e eventos.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-brand-700 text-white hover:bg-gold hover:text-black"
          onClick={() => markAsReadMutation.mutate(undefined)}
          disabled={markAsReadMutation.isPending}
        >
          Marcar todas como lidas
        </Button>
      </div>

      <div className="bg-brand-900/50 rounded-xl border border-brand-700 overflow-hidden divide-y divide-brand-800">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="p-6 space-y-3">
              <SkeletonPremium className="h-6 w-1/3" />
              <SkeletonPremium className="h-4 w-2/3" />
            </div>
          ))
        ) : notifications && notifications.length > 0 ? (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={cn(
                "p-4 md:p-6 flex items-start gap-4 hover:bg-brand-800 transition-colors cursor-pointer group",
                !notif.is_read && "bg-gold/5"
              )}
              onClick={() => !notif.is_read && markAsReadMutation.mutate(notif.id)}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all",
                notif.is_read ? "bg-brand-800" : "bg-gold/10 shadow-glow-gold"
              )}>
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={cn("text-sm font-black uppercase italic tracking-tight", !notif.is_read ? "text-white" : "text-gray-400")}>
                    {notif.title}
                  </h3>
                  <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">
                    {notif.created_at ? formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR }) : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                
                <div className="mt-3 flex items-center gap-2">
                  {notif.link && (
                    <Button 
                      size="sm" 
                      className="h-7 text-[10px] px-3 font-black uppercase tracking-widest bg-gold text-black hover:bg-gold-light"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = notif.link!;
                      }}
                    >
                      Ver Detalhes
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[10px] px-3 font-black uppercase tracking-widest text-red-400 hover:text-red-500 hover:bg-red-500/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(notif.id);
                    }}
                  >
                    <Trash2 className="size-3 mr-1" /> Excluir
                  </Button>
                </div>
              </div>
              {!notif.is_read && (
                <div className="w-2 h-2 rounded-full bg-gold mt-2 shrink-0 animate-pulse shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
              )}
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-gray-500">
            Nenhuma notificação encontrada.
          </div>
        )}
      </div>
    </div>
  );
}
