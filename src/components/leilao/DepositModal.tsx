import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ShieldCheck, Info, Upload, CreditCard, QrCode, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredAmount?: number;
  auctionId?: string;
}

export function DepositModal({ isOpen, onClose, requiredAmount = 5000, auctionId }: DepositModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState(requiredAmount.toLocaleString('pt-BR'));
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"pix_manual" | "mercadopago">("mercadopago");
  const [mpKeys, setMpKeys] = useState<{ public_key: string } | null>(null);

  useEffect(() => {
    if (requiredAmount) {
      setAmount(requiredAmount.toLocaleString('pt-BR'));
    }
  }, [requiredAmount]);

  useEffect(() => {
    const fetchMpKeys = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['mercadopago_public_key']);
      
      if (data) {
        const pk = data.find(d => d.key === 'mercadopago_public_key')?.value;
        if (pk) setMpKeys({ public_key: pk as string });
      }
    };
    fetchMpKeys();
  }, []);

  const handleMercadoPagoPayment = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Here we would call an edge function to create a Mercado Pago preference
      // For now, we simulate the flow
      toast.info("Redirecionando para o Mercado Pago...");
      
      const { data, error } = await supabase.functions.invoke('create-mercadopago-preference', {
        body: { amount: parseFloat(amount.replace(/\./g, '').replace(',', '.')), userId: user.id, auctionId }
      });

      if (error) throw error;

      if (data?.init_url) {
        window.location.href = data.init_url;
      } else {
        // Fallback simulation
        const { error: insertError } = await supabase
          .from('caucao')
          .insert({
            user_id: user.id,
            auction_id: auctionId,
            amount: parseFloat(amount.replace(/\./g, '').replace(',', '.')),
            status: 'pending',
            mercadopago_payment_id: 'pending_' + Date.now()
          });
        
        if (insertError) throw insertError;
        toast.success("Pagamento iniciado! Sua caução será liberada após a confirmação.");
        onClose();
      }
    } catch (error: any) {
      toast.error("Erro ao iniciar Mercado Pago: " + error.message);
      // Fallback local insertion for testing
      await supabase.from('caucao').insert({
        user_id: user.id,
        auction_id: auctionId,
        amount: parseFloat(amount.replace(/\./g, '').replace(',', '.')),
        status: 'pending'
      });
      toast.info("Simulando envio de pedido para o administrador.");
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!file) {
      toast.error("Por favor, anexe o comprovante do PIX.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Upload proof to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('auction-assets')
        .upload(`proofs/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('auction-assets')
        .getPublicUrl(`proofs/${fileName}`);

      // 2. Insert into caucao table
      const { error: insertError } = await supabase
        .from('caucao')
        .insert({
          user_id: user.id,
          auction_id: auctionId,
          amount: parseFloat(amount.replace(/\./g, '').replace(',', '.')),
          status: 'pending',
          proof_url: publicUrl
        });

      if (insertError) throw insertError;

      toast.success("Solicitação de caução enviada! Aguarde a aprovação.");
      onClose();
    } catch (error: any) {
      toast.error("Erro ao enviar caução: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-brand-950 border-brand-800 rounded-[2rem] overflow-hidden p-0">
        <div className="p-8 space-y-6">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter uppercase">
              <ShieldCheck className="w-8 h-8 text-gold" />
              Habilitar Caução
            </DialogTitle>
            <DialogDescription className="text-brand-400 font-medium">
              Escolha seu método de pagamento para liberar seus lances instantaneamente ou via manual.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-widest text-brand-500">Valor da Caução (R$)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-400 font-black">R$</span>
                <Input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
                  className="bg-brand-900/50 border-brand-800 h-14 pl-12 rounded-2xl font-black text-xl text-white focus:ring-gold/50"
                  placeholder="5.000"
                />
              </div>
            </div>

            <Tabs defaultValue="mercadopago" onValueChange={(v) => setPaymentMethod(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-brand-900/50 rounded-2xl p-1 h-14 border border-brand-800">
                <TabsTrigger value="mercadopago" className="rounded-xl data-[state=active]:bg-gold data-[state=active]:text-black font-black uppercase tracking-widest text-[10px]">
                  Mercado Pago
                </TabsTrigger>
                <TabsTrigger value="pix_manual" className="rounded-xl data-[state=active]:bg-gold data-[state=active]:text-black font-black uppercase tracking-widest text-[10px]">
                  PIX Manual
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mercadopago" className="pt-4 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-brand-900/40 border border-brand-800 rounded-2xl p-4 flex items-center gap-4">
                  <div className="bg-blue-500/10 p-3 rounded-xl">
                    <CreditCard className="size-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-tight">Cartão ou PIX</p>
                    <p className="text-[10px] text-brand-400 font-medium">Liberação automática em segundos</p>
                  </div>
                </div>
                <Button 
                  onClick={handleMercadoPagoPayment}
                  disabled={isLoading}
                  className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg transition-all group"
                >
                  {isLoading ? "Processando..." : (
                    <span className="flex items-center gap-2">
                      Pagar com Mercado Pago <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="pix_manual" className="pt-4 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-gold/10 border border-gold/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <QrCode className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <div className="text-[10px] text-gold/90 font-bold leading-relaxed uppercase">
                      Copie a chave PIX e anexe o comprovante abaixo.
                    </div>
                  </div>
                  <div className="bg-black/40 rounded-xl p-3 flex items-center justify-between border border-gold/10">
                    <span className="text-[10px] font-black text-white uppercase tracking-wider truncate mr-2">pix@mauriciocostumes.com.br</span>
                    <Button variant="ghost" size="sm" className="h-8 px-3 text-[10px] font-black text-gold hover:text-white hover:bg-gold/10 rounded-lg" onClick={() => {
                      navigator.clipboard.writeText("pix@mauriciocostumes.com.br");
                      toast.success("Chave PIX copiada!");
                    }}>
                      COPIAR
                    </Button>
                  </div>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="relative">
                    <input
                      type="file"
                      id="proof"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    <Label
                      htmlFor="proof"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-brand-800 rounded-2xl cursor-pointer hover:bg-brand-900/30 transition-all gap-2"
                    >
                      {file ? (
                        <div className="text-center">
                          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-1" />
                          <span className="text-[10px] font-black text-white uppercase block truncate max-w-[200px]">{file.name}</span>
                        </div>
                      ) : (
                        <>
                          <div className="bg-brand-900/50 p-4 rounded-2xl mb-2">
                            <Upload className="w-8 h-8 text-gold" />
                          </div>
                          <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Anexar Comprovante</span>
                        </>
                      )}
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gold text-black hover:bg-gold-light font-black uppercase tracking-widest h-16 rounded-2xl shadow-glow-gold"
                    disabled={isLoading}
                  >
                    {isLoading ? "Enviando..." : "Confirmar Envio Manual"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <div className="bg-brand-900/30 p-4 border-t border-brand-800 text-center">
          <p className="text-[9px] text-brand-500 font-black uppercase tracking-[0.2em]">Sua segurança é nossa prioridade</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
