import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Message {
  id: string;
  message: string;
  user_id: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface LiveChatProps {
  auctionId: string;
}

export function LiveChat({ auctionId }: LiveChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userCount, setUserCount] = useState(0);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch initial messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, profiles:profiles_public(full_name)')
        .eq('auction_id', auctionId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (!error && data) {
        setMessages(data as any);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${auctionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `auction_id=eq.${auctionId}`,
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles_public')
            .select('full_name')
            .eq('id', payload.new.user_id)
            .single();

          const messageWithProfile = {
            ...payload.new,
            profiles: profile,
          } as Message;

          setMessages((prev) => [...prev, messageWithProfile]);
        }
      )
      .subscribe();

    // Presence for user count
    const presenceChannel = supabase.channel(`presence:${auctionId}`);
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setUserCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: user?.id, online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
    };
  }, [auctionId, user?.id]);

  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      rowVirtualizer.scrollToIndex(messages.length - 1);
    }
  }, [messages.length, rowVirtualizer]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    const { error } = await supabase.from('chat_messages').insert({
      auction_id: auctionId,
      user_id: user.id,
      message: newMessage.trim(),
    });

    if (!error) {
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-brand-950/50 backdrop-blur-sm border border-brand-800 rounded-xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-brand-800 flex items-center justify-between bg-brand-900/50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-green-500 animate-pulse" />
          <h3 className="text-sm font-black uppercase tracking-widest text-brand-100">Chat ao Vivo</h3>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter text-brand-400">
          <Users className="size-3" />
          <span>{userCount} online</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div 
          ref={parentRef} 
          className="h-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-brand-800"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {messages.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="size-12 rounded-2xl bg-brand-900 border border-brand-800 flex items-center justify-center opacity-50">
                  <Send className="size-6 text-brand-600 -rotate-12" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest">Silêncio no Chat</p>
                  <p className="text-[9px] font-medium text-brand-600 uppercase tracking-widest italic">Inicie a conversa e interaja com outros licitantes.</p>
                </div>
              </div>
            ) : (
              rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const msg = messages[virtualRow.index];
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="flex gap-3 py-2"
                  >
                    <Avatar className="size-8 border border-brand-700 shrink-0">
                      <AvatarFallback className="bg-brand-800 text-brand-300 text-[10px] font-black">
                        {msg.profiles?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] font-black text-brand-300 uppercase tracking-tighter">
                          {msg.profiles?.full_name || 'Usuário'}
                        </span>
                        <span className="text-[9px] font-medium text-brand-600 tabular-nums">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-brand-100 mt-0.5 break-words">{msg.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSendMessage} className="p-3 border-t border-brand-800 bg-brand-900/50 shrink-0">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={user ? "Sua mensagem..." : "Faça login"}
            disabled={!user}
            className="h-10 bg-brand-950/50 border-brand-700 text-brand-100 placeholder:text-brand-600 text-xs"
          />
          <Button type="submit" size="icon" disabled={!user || !newMessage.trim()} className="h-10 w-10 bg-brand-600 hover:bg-brand-700 shrink-0">
            <Send className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
