import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Clock, ArrowRight, Gavel, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export function FavoritesSection() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          lot_id,
          auction_id,
          lots (*)
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      setFavorites(data || []);
    } catch (error: any) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const removeFavorite = async (id: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setFavorites(prev => prev.filter(f => f.id !== id));
      toast.success("Removido dos favoritos");
    } catch (error: any) {
      toast.error("Erro ao remover favorito");
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">Favoritos</h1>
          <p className="text-sm text-gray-400 font-medium">Acompanhe os itens que você marcou como interesse.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {favorites.length > 0 ? (
          favorites.map((fav) => {
            const item = fav.lots;
            if (!item) return null;
            
            return (
              <Card key={fav.id} className="border-none shadow-premium bg-brand-900/50 backdrop-blur-sm overflow-hidden group hover:bg-brand-800 transition-all rounded-2xl border border-brand-800 hover:border-gold/30">
                <CardContent className="p-0 flex h-full">
                  <div className="w-32 h-full flex-shrink-0 bg-brand-800 overflow-hidden relative">
                    <img src={item.image_url || "/placeholder.svg"} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gold">
                          Lote
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                          onClick={() => removeFavorite(fav.id)}
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </Button>
                      </div>
                      <h3 className="text-sm font-black text-white uppercase italic tracking-tight mt-1 line-clamp-1">{item.title}</h3>
                      <p className="text-xs text-gray-400 font-medium truncate">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm font-black text-white italic tabular-nums">
                        R$ {(item.current_highest_bid || item.starting_price || 0).toLocaleString('pt-BR')}
                      </span>
                      <Button asChild variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest gap-1 text-gray-400 hover:text-white hover:bg-brand-700 transition-all rounded-lg">
                        <Link to={`/lote/${item.id}`}>
                          Ver detalhes
                          <ArrowRight className="w-3 h-3 text-gold" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center text-gray-500 border-2 border-dashed border-brand-800 rounded-[3rem] bg-brand-900/20">
            <Heart className="w-12 h-12 text-brand-800 mx-auto mb-4 opacity-30" />
            <p className="font-black uppercase tracking-widest text-[10px]">Nenhum item nos favoritos ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}

