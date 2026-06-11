
import { useEffect, useState } from "react";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { Maximize2, Gavel } from "lucide-react";
import { SmartImage } from "../SmartImage";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";

export function LotsGrid() {
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxData, setLightboxData] = useState<{ open: boolean; index: number; images: string[] }>({
    open: false,
    index: 0,
    images: [],
  });

  useEffect(() => {
    const fetchLots = async () => {
      const { data, error } = await supabase
        .from('lots')
        .select('*, auction:auctions(title)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6);

      if (!error && data) {
        setLots(data);
      }
      setLoading(false);
    };

    fetchLots();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-64 bg-white/5 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (lots.length === 0) return null;

  return (
    <section className="mb-12">
      <header className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
            Oportunidades em Destaque
          </h2>
          <p className="text-brand-400 text-sm">
            Lotes ativos com lances abertos agora
          </p>
        </div>
        <Link to="/" className="text-xs md:text-sm font-bold text-gold hover:underline shrink-0">
          Ver catálogo completo
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {lots.map((lot, idx) => (
          <article
            key={lot.id}
            className="group bg-brand-900/40 backdrop-blur-md rounded-[2rem] border border-brand-800 overflow-hidden hover:border-gold/50 transition-all duration-500 shadow-2xl"
          >
            <Link to={`/lote/${lot.id}`} className="block">
              <div className="relative aspect-[4/3] overflow-hidden bg-black flex items-center justify-center">
                <SmartImage
                  src={lot.image_url || "/placeholder.svg"}
                  alt={lot.title}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10 text-white z-10">
                  <Maximize2 className="size-4" />
                </div>
                <span className="absolute top-3 left-3 bg-gold text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  LOTE {lot.lot_order || '00'}
                </span>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
              </div>
            </Link>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest">{lot.auction?.title || "Leilão Exclusivo"}</p>
                <h3 className="font-bold text-white group-hover:text-gold transition-colors truncate">
                  {lot.title}
                </h3>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div className="space-y-1">
                  <span className="text-[9px] text-brand-400 font-black uppercase tracking-widest block">
                    Lance Atual
                  </span>
                  <span className="text-lg font-black text-white tabular-nums">
                    {formatCurrency(Number(lot.current_highest_bid || lot.starting_price || 0))}
                  </span>
                </div>
                <Link to={`/lote/${lot.id}`} className="bg-brand-800 hover:bg-gold text-white hover:text-black size-10 rounded-full flex items-center justify-center transition-all">
                  <Gavel className="size-4" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      <ImageLightbox
        open={lightboxData.open}
        close={() => setLightboxData({ ...lightboxData, open: false })}
        images={lightboxData.images}
        index={lightboxData.index}
      />
    </section>
  );
}
