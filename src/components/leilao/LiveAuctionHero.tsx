import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, AlertTriangle, Clock, Maximize2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DepositModal } from "@/components/leilao/DepositModal";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import penthouse from "@/assets/lot-penthouse.jpg";
import { SmartImage } from "../SmartImage";

// Using formatCurrency from utils

export function LiveAuctionHero() {
  const { user } = useAuth();
  const [endsAt] = useState(() => Date.now() + 4 * 60 * 1000 + 12 * 1000);
  const [now, setNow] = useState(Date.now());
  const [depositStatus, setDepositStatus] = useState<string | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchStatus = async () => {
      const { data } = await supabase
        .from('caucao')
        .select('status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setDepositStatus(data.status);
    };
    fetchStatus();

    const channel = supabase
      .channel(`hero-deposit:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'caucao',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setDepositStatus((payload.new as any).status);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, endsAt - now);
  const mm = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");

  const currentBid = 4_250_000;
  const increment = 10_000;

  return (
    <article className="bg-card rounded-3xl p-2 border border-border shadow-elegant">
      <div 
        className="relative cursor-zoom-in group"
        onClick={() => setIsLightboxOpen(true)}
      >
        <SmartImage
          src={penthouse}
          alt="Cobertura penthouse nos Jardins, São Paulo"
          width={1600}
          height={896}
          className="w-full aspect-[16/10] md:aspect-[21/9] object-cover rounded-2xl group-hover:opacity-90 transition-opacity"
        />
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10 text-white z-10">
          <Maximize2 className="size-5" />
        </div>
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="bg-live text-live-foreground text-[10px] font-bold px-3 py-1 rounded-full live-dot">
            AO VIVO
          </span>
          <span className="bg-card/90 backdrop-blur-sm text-foreground text-[10px] font-bold px-3 py-1 rounded-full">
            AUDITORIA ATIVA
          </span>
        </div>
      </div>

      <div className="px-4 md:px-6 pt-5 pb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">
              Cobertura Duplex Jardins
            </h1>
            <p className="text-muted-foreground font-medium text-sm mt-1">
              Leilão Imobiliário #442 • Lote 01
            </p>
          </div>
          <div className="md:text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
              Lance Atual
            </p>
            <p className="text-3xl md:text-4xl font-extrabold text-brand-600 tracking-tight tabular-nums">
              {formatCurrency(currentBid)}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 py-5 border-y border-border mb-6">
          <Stat label="Participantes" value="142 online" />
          <Stat label="Incremento mín." value={formatCurrency(increment)} />
          <Stat label="Tempo restante" value={`${mm}:${ss}`} valueClass="text-live tabular-nums" />
          <Stat label="Localização" value="São Paulo, SP" />
        </dl>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex gap-2">
            <Button 
              onClick={() => depositStatus !== 'approved' && setIsDepositModalOpen(true)}
              className={cn(
                "flex-1 h-14 rounded-xl",
                depositStatus !== 'approved' && "opacity-50 grayscale cursor-not-allowed"
              )}
            >
              {depositStatus !== 'approved' ? 'CAUÇÃO NECESSÁRIA' : `DAR LANCE DE ${formatCurrency(currentBid + increment)}`}
            </Button>
            <Button
              variant="outline"
              aria-label="Aumentar incremento"
              disabled={depositStatus !== 'approved'}
              className="w-14 h-14 rounded-xl text-lg"
            >
              +
            </Button>
          </div>
          <Button 
            variant="secondary"
            onClick={() => setIsDepositModalOpen(true)}
            className="px-6 h-14 rounded-xl"
          >
            {depositStatus === 'approved' ? (
              <>
                <ShieldCheck className="w-4 h-4 text-green-500" />
                Caução Aprovada
              </>
            ) : depositStatus === 'pending' ? (
              <>
                <Clock className="w-4 h-4 text-yellow-500" />
                Caução Pendente
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Habilitar caução
              </>
            )}
          </Button>
        </div>
      </div>

      <DepositModal 
        isOpen={isDepositModalOpen} 
        onClose={() => setIsDepositModalOpen(false)} 
      />

      <ImageLightbox
        open={isLightboxOpen}
        close={() => setIsLightboxOpen(false)}
        images={[penthouse]}
      />
    </article>
  );
}

function Stat({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">
        {label}
      </dt>
      <dd className={`font-bold text-sm ${valueClass}`}>{value}</dd>
    </div>
  );
}
