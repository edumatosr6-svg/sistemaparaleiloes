import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Upload, QrCode, CheckCircle2, Wallet, Info, CreditCard, Banknote, FileText, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SalesNoteViewer } from "./SalesNoteViewer";

interface WinnerPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  winnerData: {
    id: string;
    lotId: string;
    lotTitle: string;
    finalAmount: number;
    escrowStatus?: string;
    bidAmount?: number;
    commissionAmount?: number;
    administrativeAmount?: number;
  };
}

export function WinnerPaymentModal({ isOpen, onClose, winnerData }: WinnerPaymentModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("pix");
  const [settings, setSettings] = useState<any>({});
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [mpPreferenceUrl, setMpPreferenceUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoadingSettings(true);
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('*');
        
        if (!error && data) {
          const settingsMap: Record<string, any> = {};
          data.forEach(s => {
            settingsMap[s.key] = s.value;
            // Merge site_config keys to top level for easier access
            if (s.key === 'site_config' && typeof s.value === 'object') {
              Object.assign(settingsMap, s.value);
              setSiteConfig(s.value);
            }
          });
          setSettings(settingsMap);
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoadingSettings(false);
      }
    };
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const handleMercadoPagoPayment = async (preferredMethod?: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      toast.info("Iniciando pagamento seguro...");
      
      const { data, error } = await supabase.functions.invoke('create-mercadopago-preference', {
        body: { 
          amount: winnerData.finalAmount, 
          userId: user.id, 
          lotId: winnerData.lotId,
          winnerId: winnerData.id,
          type: 'lot_payment',
          payment_method_id: preferredMethod
        }
      });

      if (error) throw error;

      if (data?.init_url) {
        setMpPreferenceUrl(data.init_url);
      }

      if (data?.preference_id && (window as any).MercadoPago) {
        const mp = new (window as any).MercadoPago(settings.mercadopago_public_key);
        mp.checkout({
          preference: {
            id: data.preference_id
          },
          autoOpen: true,
        });
      } else if (data?.init_url) {
        toast.info("Abrindo checkout externo seguro...");
        const newWindow = window.open(data.init_url, '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          toast.warning("O navegador bloqueou a janela. Use o link direto abaixo.");
        }
      } else {
        toast.error("Não foi possível gerar o link de pagamento. Tente novamente.");
      }
    } catch (error: any) {
      toast.error("Erro ao iniciar Mercado Pago: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!file) {
      toast.error("Por favor, anexe o comprovante do pagamento.");
      return;
    }

    setIsLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${winnerData.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('auction-assets')
        .upload(`proofs/payments/${fileName}`, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('auction-assets')
        .getPublicUrl(`proofs/payments/${fileName}`);

      const { error: updateError } = await supabase
        .from('auction_winners')
        .update({
          payment_proof_url: publicUrl,
          payment_method: paymentMethod,
          escrow_status: 'under_review'
        })
        .eq('id', winnerData.id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast.success("Comprovante enviado com sucesso! Aguarde a conferência pelo administrador.");
      onClose();
    } catch (error: any) {
      toast.error("Erro ao enviar comprovante: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] bg-brand-950 border-brand-800 rounded-[2.5rem] overflow-hidden p-0">
          <div className="p-8 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter uppercase italic">
                <Wallet className="w-8 h-8 text-gold" />
                {winnerData.finalAmount === 0 ? "Detalhes do Arremate" : "Pagamento do Lote"}
              </DialogTitle>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full w-fit">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Ambiente Seguro & Criptografado</span>
              </div>
              <DialogDescription className="text-brand-400 font-medium">
                Lote <span className="text-white font-bold">{winnerData.lotTitle}</span>.
              </DialogDescription>
            </DialogHeader>

            {loadingSettings ? (
              <div className="py-12 text-center text-brand-500 font-black uppercase tracking-widest animate-pulse">
                Carregando informações...
              </div>
            ) : (
              <div className="bg-brand-900/50 rounded-3xl p-6 border border-brand-800 space-y-4">
                <div className="flex justify-between items-center border-b border-brand-800 pb-4">
                  <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Valor Final</span>
                  <span className="text-2xl font-black text-white tabular-nums italic">R$ {winnerData.finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="space-y-4 pt-2">
                  {winnerData.escrowStatus === 'paid' ? (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center space-y-4">
                      <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                      <div className="space-y-1">
                        <p className="text-sm font-black text-white uppercase tracking-widest">Pagamento Confirmado!</p>
                        <p className="text-[10px] text-brand-400 font-bold">Seu arremate foi liquidado com sucesso.</p>
                      </div>
                      <Button 
                        className="w-full bg-gold text-black font-black uppercase text-[10px] h-12 rounded-xl"
                        onClick={() => setIsReceiptOpen(true)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Visualizar Recibo (Nota)
                      </Button>
                    </div>
                  ) : (
                    <>
                      {winnerData.escrowStatus === 'cancelled' && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center space-y-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-500">
                          <div className="flex items-center justify-center gap-2">
                            <Info className="w-4 h-4 text-red-500" />
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Pagamento Recusado Anteriormente</p>
                          </div>
                          <p className="text-[10px] text-red-400 font-bold leading-relaxed">
                            O Mercado Pago recusou sua tentativa por segurança ou limite. Recomendamos usar **PIX Imediato** ou saldo em conta.
                          </p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 gap-3">
                        {(settings.enable_pix !== false) && settings.pix_key && (
                          <div className="bg-gold/10 border border-gold/20 rounded-2xl p-4 space-y-3 relative group">
                            <div className="flex items-start gap-3">
                              <div className="bg-gold/20 p-2 rounded-lg shrink-0">
                                <QrCode className="w-5 h-5 text-gold" />
                              </div>
                              <div className="flex-1">
                                <p className="text-[10px] text-gold font-black uppercase tracking-widest">PAGAR VIA PIX</p>
                                <p className="text-sm font-black text-white mt-1 break-all">{settings.pix_key}</p>
                                
                                {settings.pix_qr_code_url && (
                                  <div className="mt-4 bg-white p-3 rounded-xl w-fit mx-auto md:mx-0">
                                    <img 
                                      src={settings.pix_qr_code_url} 
                                      alt="QR Code PIX" 
                                      className="size-32 object-contain"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-end mt-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 px-2 text-[9px] font-black text-gold hover:text-white hover:bg-gold/10 rounded-lg"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigator.clipboard.writeText(settings.pix_key);
                                  toast.success("Chave PIX copiada!");
                                }}
                              >
                                COPIAR CHAVE
                              </Button>
                            </div>
                          </div>
                        )}

                        {(settings.enable_bank_transfer !== false) && settings.bank_details && (
                          <div className="bg-brand-800/30 border border-brand-700 rounded-2xl p-4 space-y-3 relative group">
                            <div className="flex items-start gap-3">
                              <div className="bg-brand-700/50 p-2 rounded-lg shrink-0">
                                <Wallet className="w-5 h-5 text-gray-400" />
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Dados Bancários</p>
                                <div className="text-[11px] font-bold text-white mt-1 leading-relaxed whitespace-pre-wrap">
                                  {settings.bank_details}
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="absolute top-2 right-2 h-7 px-2 text-[9px] font-black text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"
                              onClick={(e) => {
                                e.preventDefault();
                                navigator.clipboard.writeText(settings.bank_details);
                                toast.success("Dados bancários copiados!");
                              }}
                            >
                              COPIAR
                            </Button>
                          </div>
                        )}

                        {settings.enable_mercadopago && (
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="bg-blue-500/20 p-2 rounded-lg shrink-0">
                                <CreditCard className="w-5 h-5 text-blue-400" />
                              </div>
                              <div>
                                <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Pagar com Mercado Pago</p>
                                <p className="text-[11px] font-bold text-white mt-1">
                                  Cartão de Crédito ou PIX Automático.
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <Button 
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] h-10 rounded-xl shadow-lg flex items-center justify-center gap-2"
                                onClick={() => handleMercadoPagoPayment()}
                                disabled={isLoading}
                              >
                                <CreditCard className="w-4 h-4" />
                                {isLoading ? "Processando..." : "PAGAR COM CARTÃO"}
                              </Button>
                              <Button 
                                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-black uppercase text-[10px] h-10 rounded-xl shadow-lg flex items-center justify-center gap-2"
                                onClick={() => handleMercadoPagoPayment('pix')}
                                disabled={isLoading}
                              >
                                <QrCode className="w-4 h-4" />
                                {isLoading ? "Processando..." : "PIX IMEDIATO"}
                              </Button>
                            </div>

                            {winnerData.finalAmount > 10000 && (
                              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
                                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-[9px] font-bold text-amber-500 uppercase leading-relaxed">
                                  {winnerData.finalAmount > 50000 
                                    ? "Atenção: Devido ao alto valor, o Mercado Pago pode restringir o pagamento via Cartão de Crédito por limites de segurança. Caso a opção não apareça, utilize o PIX do Mercado Pago ou Transferência Bancária."
                                    : "Atenção: Para valores acima de R$ 10.000,00, o pagamento via Cartão de Crédito pode ser recusado pelo banco ou operadora. Recomendamos o uso de PIX para maior agilidade."
                                  }
                                </p>
                              </div>
                            )}

                            {mpPreferenceUrl && (
                              <p className="text-[9px] text-center text-blue-400 mt-2">
                                Problemas com o checkout? <a href={mpPreferenceUrl} target="_blank" rel="noreferrer" className="underline font-bold">Clique aqui para abrir em nova aba</a>
                              </p>
                            )}
                          </div>
                        )}

                        {!settings.enable_pix && !settings.enable_bank_transfer && !settings.enable_mercadopago && (
                          <div className="p-8 text-center text-brand-400 font-bold italic border-2 border-dashed border-brand-800 rounded-3xl">
                            Nenhum método de pagamento automático configurado. Utilize o formulário abaixo para anexar seu comprovante.
                          </div>
                        )}
                      </div>

                      <form onSubmit={handleManualSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Forma de Pagamento Utilizada</Label>
                          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger className="bg-brand-950 border-brand-800 text-white h-12 rounded-xl">
                              <SelectValue placeholder="Selecione como pagou" />
                            </SelectTrigger>
                            <SelectContent className="bg-brand-900 border-brand-800 text-white">
                              <SelectItem value="pix">PIX</SelectItem>
                              <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                              <SelectItem value="mercadopago">Mercado Pago (Manual)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="relative">
                          <input
                            type="file"
                            id="winner-proof"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                          />
                          <Label
                            htmlFor="winner-proof"
                            className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-brand-800 rounded-3xl cursor-pointer hover:bg-brand-900/30 transition-all gap-3 bg-brand-950/50"
                          >
                            {file ? (
                              <div className="text-center p-4">
                                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                                <span className="text-[10px] font-black text-white uppercase block truncate max-w-[250px]">{file.name}</span>
                                <span className="text-[9px] text-brand-500 font-bold uppercase mt-1 block">Clique para alterar</span>
                              </div>
                            ) : (
                              <>
                                <div className="bg-brand-800 p-4 rounded-2xl group-hover:bg-brand-700 transition-colors flex items-center justify-center">
                                  <Upload className="w-8 h-8 text-gold" />
                                </div>
                                <div className="text-center">
                                  <span className="text-[10px] font-black text-white uppercase tracking-widest block">Anexar Comprovante</span>
                                  <span className="text-[9px] text-brand-500 font-bold uppercase mt-1 block">Envie o print do PIX ou Transferência</span>
                                </div>
                              </>
                            )}
                          </Label>
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-gold text-black hover:bg-gold-light font-black uppercase tracking-widest h-16 rounded-2xl shadow-glow-gold transition-all hover:scale-[1.02] active:scale-[0.98]"
                          disabled={isLoading}
                        >
                          {isLoading ? "Processando..." : "Confirmar Pagamento"}
                        </Button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-brand-900/30 p-4 border-t border-brand-800 text-center">
            <p className="text-[9px] text-brand-500 font-black uppercase tracking-[0.2em]">Pagamento seguro processado manualmente</p>
          </div>
        </DialogContent>
      </Dialog>

      {isReceiptOpen && (
        <SalesNoteViewer 
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          data={{
            winnerId: winnerData.id,
            date: new Date().toLocaleDateString('pt-BR'),
            lotTitle: winnerData.lotTitle,
            lotOrder: 1, // Optional or fetched
            auctionTitle: "Leilão Oficial",
            userName: user?.email || "Usuário",
            bidAmount: winnerData.bidAmount || 0,
            commissionAmount: winnerData.commissionAmount || 0,
            commissionRate: 5,
            administrativeAmount: winnerData.administrativeAmount || 0,
            finalAmount: winnerData.finalAmount,
            logoUrl: siteConfig?.logo_url,
            siteName: siteConfig?.name,
            auctioneerName: siteConfig?.auctioneer_name,
            auctioneerRegistration: siteConfig?.auctioneer_registration,
            logoHeight: siteConfig?.logo_height
          }}
        />
      )}
    </>
  );
}
