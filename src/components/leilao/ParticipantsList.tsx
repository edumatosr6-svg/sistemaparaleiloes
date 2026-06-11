import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShieldCheck, ShieldAlert, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface Participant {
  user_id: string;
  full_name?: string;
  online_at: string;
  deposit_status?: string | null;
}

interface ParticipantsListProps {
  auctionId: string;
}

export function ParticipantsList({ auctionId }: ParticipantsListProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    const checkAdmin = async () => {
      const { data } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single();
      if (data?.role === 'admin') setIsAdmin(true);
    };
    checkAdmin();
  }, [currentUser]);

  useEffect(() => {
    const channel = supabase.channel(`presence:${auctionId}`);

    channel
      .on('presence', { event: 'sync' }, async () => {
        const state = channel.presenceState();
        const users: any[] = [];
        
        for (const id in state) {
          const presence: any = state[id][0];
          if (presence.user_id) {
            users.push({
              user_id: presence.user_id,
              online_at: presence.online_at
            });
          }
        }

        if (users.length > 0) {
          const userIds = users.map(u => u.user_id);
          
          // Fetch profiles and deposit status
          const [profilesRes, depositsRes] = await Promise.all([
            supabase.from('profiles_public').select('id, full_name').in('id', userIds),
            supabase.from('caucao').select('user_id, status').in('user_id', userIds).order('created_at', { ascending: false })
          ]);

          const participantsWithInfo = users.map(u => {
            const profile = profilesRes.data?.find(p => p.id === u.user_id);
            const deposit = depositsRes.data?.find(d => d.user_id === u.user_id);
            return {
              ...u,
              full_name: profile?.full_name || 'Licitante Anônimo',
              deposit_status: deposit?.status || null
            };
          });

          setParticipants(participantsWithInfo);
        } else {
          setParticipants([]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [auctionId]);

  const handleManualApprove = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('caucao')
        .upsert({
          user_id: userId,
          status: 'approved',
          is_manual_approval: true,
          amount: 0 // Free override
        }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success("Usuário liberado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao liberar usuário: " + error.message);
    }
  };

  return (
    <Card className="border-brand-800 bg-brand-950/50 backdrop-blur-sm overflow-hidden flex flex-col h-full">
      <CardHeader className="p-4 border-b border-brand-800 bg-brand-900/50">
        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-brand-100">
          <Users className="size-4 text-brand-400" />
          Participantes Online ({participants.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {participants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4">
                <div className="size-12 rounded-2xl bg-brand-900 border border-brand-800 flex items-center justify-center">
                  <Users className="size-6 text-brand-700" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest">Auditório Silencioso</p>
                  <p className="text-[9px] font-medium text-brand-600 uppercase tracking-widest italic">Aguardando entrada de licitantes...</p>
                </div>
              </div>
            ) : (
              participants.map((p) => (
                <div key={p.user_id} className="flex items-center justify-between group bg-white/5 p-2 rounded-xl border border-white/5 hover:border-gold/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="size-8 border border-brand-700 transition-transform group-hover:scale-110 shadow-lg">
                        <AvatarFallback className="bg-brand-800 text-brand-300 text-[10px] font-black uppercase">
                          {p.full_name?.charAt(0) || 'L'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 size-2.5 bg-green-500 border-2 border-brand-950 rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[10px] font-black text-brand-100 truncate uppercase tracking-tighter">{p.full_name}</p>
                        {p.deposit_status === 'approved' ? (
                          <CheckCircle className="size-3 text-green-500" />
                        ) : (
                          <ShieldAlert className="size-3 text-brand-600" />
                        )}
                      </div>
                      <p className="text-[8px] text-brand-500 uppercase font-black tracking-[0.1em]">
                        {p.deposit_status === 'approved' ? 'Habilitado' : 'Aguardando Caução'}
                      </p>
                    </div>
                  </div>

                  {isAdmin && p.deposit_status !== 'approved' && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleManualApprove(p.user_id)}
                      className="h-7 px-2 bg-gold/10 hover:bg-gold text-gold hover:text-black text-[8px] font-black uppercase tracking-widest rounded-lg border border-gold/20"
                    >
                      LIBERAR
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
