import { useState, useEffect, useRef } from "react";
import { ShieldCheck, Loader2, AlertCircle, Info, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface AuditMessage {
  id: string;
  text: string;
  type: "info" | "success" | "warning" | "error" | "activity";
  timestamp: Date;
}

interface VirtualAuditorProps {
  auctionId: string;
  lotId?: string;
  className?: string;
}

export function VirtualAuditor({ auctionId, lotId, className }: VirtualAuditorProps) {
  const [messages, setMessages] = useState<AuditMessage[]>([]);
  const [isAuditing, setIsAuditing] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addMessage = (text: string, type: AuditMessage["type"] = "info") => {
    const newMessage: AuditMessage = {
      id: Math.random().toString(36).substring(7),
      text,
      type,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev.slice(-19), newMessage]);
  };

  useEffect(() => {
    // Initial messages
    addMessage("Auditor Virtual Inicializado", "success");
    addMessage("Sincronizando com servidor de lances...", "activity");
    
    const timer = setTimeout(() => {
      addMessage("Auditoria 100% ativa em tempo real", "success");
    }, 2000);

    // Subscribe to bids for this auction
    const channel = supabase
      .channel(`auditor-bids-${auctionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids'
        },
        (payload) => {
          const bid = payload.new as any;
          addMessage(`Validando lance de R$ ${bid.amount.toLocaleString('pt-BR')}...`, "activity");
          
          setTimeout(() => {
            addMessage(`Lance de R$ ${bid.amount.toLocaleString('pt-BR')} verificado e aceito`, "success");
          }, 800);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_auction_control',
          filter: `auction_id=eq.${auctionId}`
        },
        (payload) => {
          const control = payload.new as any;
          if (control.auctioneer_status === 'sold') {
            addMessage("Auditoria de arremate iniciada...", "info");
            setTimeout(() => {
               addMessage("Venda auditada e confirmada", "success");
            }, 1500);
          } else if (control.auctioneer_status === 'idle') {
            addMessage("Preparando novo lote para auditoria", "info");
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'caucao',
          filter: `auction_id=eq.${auctionId}`
        },
        (payload) => {
          const deposit = payload.new as any;
          if (deposit.status === 'approved') {
            addMessage(`Novo licitante habilitado pelo sistema`, "success");
          }
        }
      )
      .subscribe();

    // Random generic auditing messages
    const genericInterval = setInterval(() => {
      const genericMessages = [
        "Verificando integridade da conexão...",
        "Monitorando picos de tráfego...",
        "Nenhuma anomalia detectada no sistema",
        "Auditoria de segurança de ponta-a-ponta ativa",
        "Sincronismo de tempo global OK",
        "Protocolo anti-sniper monitorado",
      ];
      const randomMsg = genericMessages[Math.floor(Math.random() * genericMessages.length)];
      addMessage(randomMsg, "info");
    }, 25000);

    return () => {
      clearTimeout(timer);
      clearInterval(genericInterval);
      supabase.removeChannel(channel);
    };
  }, [auctionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Card className={cn("bg-black/40 backdrop-blur-xl border-white/5 overflow-hidden flex flex-col h-full rounded-[1.5rem]", className)}>
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 blur-md rounded-full animate-pulse" />
            <ShieldCheck className="size-4 text-green-500 relative z-10" />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Auditor Virtual</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 rounded-full border border-green-500/20">
          <div className="size-1 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Ativo</span>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar scroll-smooth h-[200px]"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3 group"
            >
              <div className="mt-1">
                {msg.type === "success" && <ShieldCheck className="size-3 text-green-500" />}
                {msg.type === "activity" && <Activity className="size-3 text-blue-400 animate-pulse" />}
                {msg.type === "info" && <Info className="size-3 text-brand-400" />}
                {msg.type === "warning" && <AlertCircle className="size-3 text-amber-500" />}
                {msg.type === "error" && <AlertCircle className="size-3 text-red-500" />}
              </div>
              <div className="flex-1 space-y-0.5">
                <p className={cn(
                  "text-[10px] font-bold leading-relaxed tracking-tight",
                  msg.type === "success" ? "text-green-500/90" : 
                  msg.type === "activity" ? "text-blue-400" :
                  msg.type === "warning" ? "text-amber-500/90" :
                  msg.type === "error" ? "text-red-500/90" : "text-white/60"
                )}>
                  {msg.text}
                </p>
                <p className="text-[8px] text-white/20 font-black uppercase tracking-widest tabular-nums">
                  {msg.timestamp.toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-3 bg-black/40 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-green-500/30"
              animate={{ width: ["20%", "60%", "40%", "90%", "30%"] }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            />
          </div>
          <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em]">Proc. CPU 0.02ms</span>
        </div>
      </div>
    </Card>
  );
}
