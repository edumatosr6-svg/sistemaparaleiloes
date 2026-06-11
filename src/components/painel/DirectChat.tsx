import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DirectChatProps {
  recipientId: string;
  recipientName?: string;
  winnerId?: string; 
}

export function DirectChat({ recipientId, recipientName, winnerId }: DirectChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .or(`and(user_id.eq.${user.id},recipient_id.eq.${recipientId}),and(user_id.eq.${recipientId},recipient_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (err: any) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`direct_chat:${user.id}:${recipientId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `recipient_id=eq.${user.id}`
      }, (payload) => {
        if (payload.new.user_id === recipientId) {
          setMessages(prev => [...prev, payload.new]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, recipientId]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          recipient_id: recipientId,
          message: newMessage.trim(),
          auction_id: null // Explicitly null as it's a direct message
        } as any)
        .select()
        .single();

      if (error) throw error;
      setMessages(prev => [...prev, data]);
      setNewMessage("");
    } catch (err: any) {
      toast.error("Erro ao enviar mensagem: " + err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[400px] bg-brand-900/50 border border-brand-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-4 bg-brand-800 border-b border-brand-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 border-2 border-brand-600">
            <AvatarFallback className="bg-brand-700 text-brand-200">
              {recipientName ? recipientName[0] : 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-black text-white uppercase italic tracking-tight">{recipientName || 'Usuário'}</h3>
            <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
              Conectado
            </p>
          </div>
        </div>
        <MessageSquare className="size-5 text-gold" />
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="py-12 text-center text-gray-500 text-xs font-black uppercase tracking-widest italic">
              Inicie uma conversa agora.
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.user_id === user?.id;
            return (
              <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                <div className={cn(
                  "max-w-[80%] p-3 rounded-2xl text-sm font-medium shadow-lg",
                  isMe ? "bg-gold text-black rounded-tr-none" : "bg-brand-800 text-white rounded-tl-none border border-brand-700"
                )}>
                  {msg.message}
                </div>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter mt-1 px-1">
                  {format(new Date(msg.created_at), 'HH:mm', { locale: ptBR })}
                </span>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-4 bg-brand-800 border-t border-brand-700 flex gap-2">
        <Input 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="bg-brand-950 border-brand-700 h-12 rounded-xl text-white font-medium focus:ring-gold/30"
          disabled={sending}
        />
        <Button 
          type="submit" 
          size="icon" 
          className="size-12 rounded-xl bg-gold text-black hover:bg-gold-light shadow-glow-gold transition-all"
          disabled={sending || !newMessage.trim()}
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </Button>
      </form>
    </div>
  );
}
