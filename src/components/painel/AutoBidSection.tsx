import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, Gavel, Trash2, Edit3, ShieldCheck, Loader2 } from "lucide-react";
import { SkeletonPremium } from "@/components/ui/skeleton-premium";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AutoBidSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newLotId, setNewLotId] = useState("");
  const [newMaxAmount, setNewMaxAmount] = useState("");

  const { data: autoBids, isLoading } = useQuery({
    queryKey: ["auto-bids", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("auto_bids")
        .select("*, lots(title, current_highest_bid, starting_price)")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: activeLots } = useQuery({
    queryKey: ["active-lots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lots")
        .select("id, title")
        .eq("status", "active");
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user || !newLotId || !newMaxAmount) throw new Error("Preencha todos os campos");
      const cleanAmount = newMaxAmount.replace(/\./g, '').replace(',', '.');
      const { error } = await supabase
        .from("auto_bids")
        .insert({
          user_id: user.id,
          lot_id: newLotId,
          max_amount: parseFloat(cleanAmount),
          is_active: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-bids", user?.id] });
      setNewLotId("");
      setNewMaxAmount("");
      toast.success("Auto Bid configurado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao configurar Auto Bid: " + error.message);
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string, active: boolean }) => {
      const { error } = await supabase
        .from("auto_bids")
        .update({ is_active: active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-bids", user?.id] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("auto_bids")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-bids", user?.id] });
      toast.success("Auto Bid removido.");
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonPremium className="h-10 w-64" />
        {[1, 2].map(i => (
          <SkeletonPremium key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">Auto Bid (Lance Automático)</h1>
          <p className="text-sm text-gray-400 font-medium">O sistema dará lances por você até o limite definido.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-gold/10 text-gold rounded-full text-[10px] font-black uppercase tracking-widest border border-gold/20">
          <ShieldCheck className="w-3 h-3" />
          Sistema Inteligente Ativo
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {autoBids && autoBids.length > 0 ? (
          autoBids.map((bid) => (
            <Card key={bid.id} className="border-brand-800 bg-brand-900 shadow-xl overflow-hidden rounded-3xl">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-800 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-black text-white uppercase italic tracking-tight">{(bid.lots as any)?.title || "Lote Desconhecido"}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-xs text-gray-400 font-medium">
                          Lance Atual: <span className="font-black text-white">R$ {((bid.lots as any)?.current_highest_bid || (bid.lots as any)?.starting_price || 0).toLocaleString('pt-BR')}</span>
                        </p>
                        <p className="text-xs text-gray-400 font-medium">
                          Seu Limite: <span className="font-black text-gold">R$ {Number(bid.max_amount).toLocaleString('pt-BR')}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <Label htmlFor={`active-${bid.id}`} className="text-sm font-bold text-gray-300">
                        {bid.is_active ? "Ativo" : "Inativo"}
                      </Label>
                      <Switch 
                        id={`active-${bid.id}`} 
                        checked={bid.is_active || false} 
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: bid.id, active: checked })}
                      />
                    </div>
                    <div className="flex items-center gap-2 border-l border-brand-800 pl-6">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-red-500 hover:bg-red-500/10" onClick={() => deleteMutation.mutate(bid.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-10 text-center text-muted-foreground border rounded-3xl border-dashed">
            Nenhum lance automático configurado.
          </div>
        )}
      </div>

      <Card className="border-brand-800 bg-brand-900 shadow-2xl rounded-3xl overflow-hidden border-2">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gold text-black rounded-2xl shadow-glow-gold">
              <Gavel className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Novo Auto Bid</h3>
              <p className="text-sm text-gray-400 font-medium">Configure um novo lance automático para um lote em andamento.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Lote Selecionado</Label>
              <Select value={newLotId} onValueChange={setNewLotId}>
                <SelectTrigger className="bg-brand-800 border-brand-700 text-white h-12 rounded-xl">
                  <SelectValue placeholder="Selecione um lote..." />
                </SelectTrigger>
                <SelectContent className="bg-brand-900 border-brand-800 text-white">
                  {activeLots?.map(lot => (
                    <SelectItem key={lot.id} value={lot.id} className="focus:bg-brand-800 focus:text-white">{lot.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Valor Máximo (R$)</Label>
              <Input 
                type="text" 
                placeholder="Ex: 50.000" 
                value={newMaxAmount} 
                onChange={(e) => setNewMaxAmount(e.target.value.replace(/[^\d.,]/g, ''))} 
                className="bg-brand-800 border-brand-700 text-white h-12 rounded-xl placeholder:text-gray-500 font-black text-lg focus:border-gold transition-colors"
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full h-12 bg-gold text-black hover:bg-gold-light rounded-xl font-black uppercase tracking-widest transition-all shadow-glow-gold hover:scale-[1.02] active:scale-95" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Configurando..." : "Ativar Auto Bid"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
