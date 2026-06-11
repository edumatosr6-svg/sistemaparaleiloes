import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  lotId?: string;
  auctionId?: string;
  className?: string;
  variant?: "ghost" | "outline" | "secondary";
  size?: "icon" | "sm" | "default";
}

export function FavoriteButton({ lotId, auctionId, className, variant = "ghost", size = "icon" }: FavoriteButtonProps) {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkFavorite() {
      if (!user) return;
      
      const query = supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id);
      
      if (lotId) query.eq('lot_id', lotId);
      else if (auctionId) query.eq('auction_id', auctionId);
      
      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        setIsFavorited(true);
      }
    }
    
    checkFavorite();
  }, [user, lotId, auctionId]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("Faça login para salvar nos favoritos");
      return;
    }

    try {
      setLoading(true);
      if (isFavorited) {
        const query = supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id);
        
        if (lotId) query.eq('lot_id', lotId);
        else if (auctionId) query.eq('auction_id', auctionId);
        
        const { error } = await query;
        if (error) throw error;
        setIsFavorited(false);
        toast.success("Removido dos favoritos");
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            lot_id: lotId,
            auction_id: auctionId
          });
        
        if (error) throw error;
        setIsFavorited(true);
        toast.success("Salvo nos favoritos!");
      }
    } catch (error: any) {
      toast.error("Erro ao atualizar favoritos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleFavorite}
      disabled={loading}
      className={cn(
        "rounded-full transition-all duration-300",
        isFavorited ? "text-red-500 fill-red-500 bg-red-500/10 hover:bg-red-500/20" : "text-gray-400 hover:text-white",
        className
      )}
    >
      <Heart className={cn("size-5", isFavorited && "fill-current")} />
    </Button>
  );
}
