import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gavel, Clock, Trophy, ArrowRight, FileText, Download, Maximize2, MessageCircle, AlertCircle, CheckCircle2, PenTool, BadgeCheck } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DirectChat } from "./DirectChat";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { SkeletonPremium } from "@/components/ui/skeleton-premium";
import { ContractViewer } from "./ContractViewer";
import { SalesNoteViewer } from "./SalesNoteViewer";
import { WinnerPaymentModal } from "./WinnerPaymentModal";

export function BidsSection({ type = "all" }: { type?: "all" | "active" | "won" }) {
  const { user } = useAuth();
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isContractViewerOpen, setIsContractViewerOpen] = useState(false);
  const [isSalesNoteOpen, setIsSalesNoteOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [selectedSalesNote, setSelectedSalesNote] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lightboxData, setLightboxData] = useState<{ open: boolean; index: number; images: string[] }>({
    open: false,
    index: 0,
    images: [],
  });

  useEffect(() => {
    if (!user) return;

    const fetchBids = async () => {
      setLoading(true);
      try {
        const [{ data: configData }, { data: profileData }, { data: adminData }] = await Promise.all([
          supabase.from('system_settings').select('value').eq('key', 'site_config').maybeSingle(),
          supabase.from('profiles').select('*, profiles_private(*)').eq('id', user.id).single(),
          supabase.from('profiles').select('id').eq('role', 'admin').limit(1).maybeSingle()
        ]);
        setSiteConfig(configData?.value || {});
        setAdminId(adminData?.id || null);
        
        const flattenedProfile = profileData ? {
          ...profileData,
          ...(profileData as any).profiles_private
        } : null;
        setProfile(flattenedProfile);

        if (type === "won") {
          const { data, error } = await supabase
            .from('auction_winners')
            .select(`
              *,
              lot:lots!auction_winners_lot_id_fkey (*, auction:auctions(*)),
              contract:contracts (*)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          setBids(data || []);
        } else {
          const { data, error } = await supabase
            .from('bids')
            .select(`
              *,
              lot:lots (*, auction:auctions(*))
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          
          const latestBids = data?.reduce((acc: any[], current) => {
            const x = acc.find(item => item.lot_id === current.lot_id);
            if (!x) return acc.concat([current]);
            return acc;
          }, []) || [];
          
          if (type === 'active') {
            setBids(latestBids.filter(b => b.lot?.status === 'active'));
          } else {
            setBids(latestBids);
          }
        }
      } catch (err: any) {
        toast.error("Erro ao carregar lances: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
  }, [user, type]);

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonPremium className="h-10 w-48" />
        {[1, 2, 3].map(i => (
          <SkeletonPremium key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const getWinnerData = (item: any) => ({
    winnerId: item.id,
    number: item.id.slice(0, 8).toUpperCase(),
    date: new Date(item.created_at).toLocaleDateString('pt-BR'),
    lotName: item.lot?.title,
    lotTitle: item.lot?.title,
    lotOrder: item.lot?.lot_order,
    auctionTitle: item.lot?.auction?.title,
    userName: profile?.full_name || user?.email || "Usuário",
    userCpfCnpj: profile?.cpf_cnpj,
    userAddress: profile?.address,
    amount: item.final_amount || 0,
    bidAmount: item.bid_amount,
    commissionAmount: item.commission_amount,
    commissionRate: item.lot?.auction?.commission_rate || 5,
    administrativeAmount: item.administrative_amount,
    finalAmount: item.final_amount,
    logoUrl: siteConfig?.logo_url,
    siteName: siteConfig?.name,
    auctioneerName: siteConfig?.auctioneer_name,
    auctioneerRegistration: siteConfig?.auctioneer_registration,
    logoHeight: siteConfig?.logo_height,
    digitalSignatureUrl: item.digital_signature_url,
    digitallySignedAt: item.digitally_signed_at
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="dashboard-title text-2xl text-white">
            {type === "all" ? "Meus Lances" : type === "active" ? "Leilões Ativos" : "Meus Arremates"}
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            {type === "won" 
              ? "Confira os itens que você arrematou e finalize seu pagamento." 
              : "Acompanhe suas disputas em tempo real."}
          </p>
        </div>
      </div>

      {type === "won" && bids.length > 0 && (
        <div className="bg-brand-900/40 border border-brand-800 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 mb-8">
          <div className="bg-gold/10 p-4 rounded-2xl shrink-0">
            <BadgeCheck className="w-8 h-8 text-gold" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Fluxo de Finalização</h3>
            <p className="text-sm text-gray-400 mt-1 font-medium">
              Siga os passos: <span className="text-gold font-bold">1. Assinar Contrato</span> (Aceite Digital) → <span className="text-gold font-bold">2. Efetuar Pagamento</span> (Anexar Comprovante) → <span className="text-gold font-bold">3. Aguardar Entrega</span>.
            </p>
          </div>
          <div className="flex gap-4 md:ml-auto">
             <div className="text-center px-4 py-2 bg-brand-800/50 rounded-xl border border-brand-700">
               <p className="text-[10px] text-gray-500 font-black uppercase">Arremates</p>
               <p className="text-xl font-black text-white">{bids.length}</p>
             </div>
             <div className="text-center px-4 py-2 bg-brand-800/50 rounded-xl border border-brand-700">
               <p className="text-[10px] text-gray-500 font-black uppercase">Pendentes</p>
               <p className="text-xl font-black text-amber-500">{bids.filter(b => b.escrow_status === 'pending').length}</p>
             </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {bids.map((item) => {
          const lot = item.lot;
          const amount = type === "won" ? item.final_amount : item.amount;
          const status = type === "won" ? "won" : (lot.current_highest_bid === item.amount ? "leading" : "outbid");

          return (
            <Card key={item.id} className="border-brand-800 bg-brand-900 shadow-xl overflow-hidden hover:border-gold/30 transition-all rounded-3xl border-2 group/card">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div 
                    className="w-full md:w-56 h-40 md:h-auto bg-brand-800 overflow-hidden relative cursor-zoom-in group/img border-b md:border-b-0 md:border-r border-brand-800"
                    onClick={() => {
                      const img = lot.image_url || "/placeholder.svg";
                      setLightboxData({ open: true, index: 0, images: [img] });
                    }}
                  >
                    <img 
                      src={lot.image_url || "/placeholder.svg"} 
                      alt={lot.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <Maximize2 className="size-8 text-white drop-shadow-lg" />
                    </div>
                    {type === "won" && (
                      <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20">
                        Arrematado
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-5 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest font-black">
                          <Clock className="w-3 h-3 text-gold" />
                          Lote #{lot.lot_order} • {lot.auction?.title}
                        </div>
                        <h3 className="text-2xl font-black text-white italic tracking-tight">{lot.title}</h3>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Lance Base</p>
                          <p className="text-sm font-black text-white tabular-nums tracking-tighter">R$ {item.bid_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>

                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Comissão ({lot.auction?.commission_rate || 5}%)</p>
                          <p className="text-sm font-black text-gold tabular-nums tracking-tighter">+ R$ {item.commission_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>

                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Taxa Adm.</p>
                          <p className="text-sm font-black text-white/70 tabular-nums tracking-tighter">+ R$ {item.administrative_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>

                        <div>
                          <p className="text-[10px] text-gold font-black uppercase tracking-widest mb-1">Total Arremate</p>
                          <p className="text-xl font-black text-white tabular-nums tracking-tighter drop-shadow-glow-gold">R$ {item.final_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-6 border-t border-brand-800/50 pt-4">
                        <div className="flex flex-col">
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Status Pagamento</p>
                          <span className={cn(
                            "text-[9px] px-3 py-1.5 rounded-xl font-black uppercase tracking-widest border w-fit flex items-center gap-2",
                            item.escrow_status === "paid" ? "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]" : 
                            item.payment_proof_url ? "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]" :
                            item.escrow_status === "pending" ? "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : 
                            "bg-gray-500/10 text-gray-400 border-gray-500/20"
                          )}>
                            {item.escrow_status === 'paid' ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
                            {item.escrow_status === 'paid' ? 'Liquidado' : 
                             item.escrow_status === 'under_review' ? 'Em Análise' :
                             item.payment_proof_url ? 'Em Análise' :
                             item.escrow_status === 'pending' ? 'Aguardando Pagamento' : 
                             item.escrow_status === 'shipped' ? 'Lote Enviado' : 
                             item.escrow_status === 'refunded' ? 'Estornado' : 'Cancelado'}
                          </span>
                        </div>

                        <div className="flex flex-col border-l border-brand-800 pl-6">
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Data do Arremate</p>
                          <p className="text-xs font-bold text-white uppercase">{new Date(item.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>

                        {item.digitally_signed_at && (
                          <div className="flex flex-col border-l border-brand-800 pl-6">
                            <p className="text-[10px] text-green-500 uppercase font-black tracking-widest mb-1">Contrato Assinado</p>
                            <p className="text-xs font-bold text-green-400 uppercase">{new Date(item.digitally_signed_at).toLocaleDateString('pt-BR')} às {new Date(item.digitally_signed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        )}
                      </div>

                      {type === "won" && item.escrow_status === "pending" && !item.payment_proof_url && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-4">
                          <div className="bg-red-500/20 p-2.5 rounded-xl">
                            <Clock className="size-5 text-red-500 animate-pulse" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-0.5">Ação Necessária</p>
                            <p className="text-xs text-brand-200 font-bold">Realize o pagamento em até 24h para garantir seu lote.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col md:items-end gap-3 min-w-[200px]">
                      {type === "won" ? (
                        <>
                          {/* Main Action Button */}
                          <Button 
                            className={cn(
                              "w-full gap-2 text-black font-black uppercase tracking-widest min-h-[3rem] h-auto py-3 rounded-2xl transition-all shadow-lg",
                              item.escrow_status === 'pending' && !item.payment_proof_url ? "bg-green-500 hover:bg-green-600 text-white shadow-green-500/20" : 
                              !item.digitally_signed_at ? "bg-gold hover:bg-gold-light animate-pulse" : 
                              "bg-brand-800 text-white hover:bg-brand-700"
                            )}
                            onClick={() => {
                              if (item.escrow_status === 'pending' && !item.payment_proof_url) {
                                setPaymentData({ 
                                  id: item.id, 
                                  lotId: item.lot_id, 
                                  lotTitle: lot.title, 
                                  finalAmount: item.final_amount,
                                  escrowStatus: item.escrow_status,
                                  bidAmount: item.bid_amount,
                                  commissionAmount: item.commission_amount,
                                  administrativeAmount: item.administrative_amount
                                });
                                setIsPaymentModalOpen(true);
                              } else if (!item.digitally_signed_at) {
                                setSelectedContract(getWinnerData(item));
                                setIsContractViewerOpen(true);
                              } else {
                                setSelectedContract(getWinnerData(item));
                                setIsContractViewerOpen(true);
                              }
                            }}
                          >
                            {item.escrow_status === 'pending' && !item.payment_proof_url ? (
                              <>
                                <Trophy className="w-5 h-5" />
                                EFETUAR PAGAMENTO
                              </>
                            ) : !item.digitally_signed_at ? (
                              <>
                                <PenTool className="w-5 h-5" />
                                ASSINAR CONTRATO
                              </>
                            ) : (
                              <>
                                <FileText className="w-5 h-5" />
                                VER CONTRATO
                              </>
                            )}
                          </Button>

                          {/* Secondary Action (Sign Contract if not yet signed and payment is main action) */}
                          {item.escrow_status === 'pending' && !item.payment_proof_url && !item.digitally_signed_at && (
                            <Button 
                              variant="outline"
                              className="w-full gap-2 border-gold/50 text-gold hover:bg-gold/10 font-black uppercase tracking-widest h-11 rounded-xl animate-pulse"
                              onClick={() => {
                                setSelectedContract(getWinnerData(item));
                                setIsContractViewerOpen(true);
                              }}
                            >
                              <PenTool className="w-4 h-4" />
                              ASSINAR CONTRATO
                            </Button>
                          )}
                          
                          <div className="grid grid-cols-3 w-full gap-2">
                            <Button 
                              variant="outline" 
                              className="gap-2 border-brand-700 text-white hover:bg-brand-800 text-[10px] font-black uppercase tracking-widest h-10 rounded-xl"
                              onClick={() => {
                                setSelectedSalesNote(getWinnerData(item));
                                setIsSalesNoteOpen(true);
                              }}
                            >
                              <Download className="w-4 h-4 text-gold" />
                              Nota
                            </Button>
                            <Button 
                              variant="outline" 
                              className="gap-2 border-brand-700 text-white hover:bg-brand-800 text-[10px] font-black uppercase tracking-widest h-10 rounded-xl"
                              onClick={() => {
                                // Request modification logic: open chat with a pre-filled message
                                setIsChatOpen(true);
                                // Here we could pass a message if DirectChat supported it, 
                                // but for now it just opens the chat.
                              }}
                            >
                              <PenTool className="w-4 h-4 text-gold" />
                              Alterar
                            </Button>
                            <Button 
                              variant="outline" 
                              className="gap-2 border-brand-700 text-white hover:bg-brand-800 text-[10px] font-black uppercase tracking-widest h-10 rounded-xl"
                              onClick={() => setIsChatOpen(true)}
                            >
                              <MessageCircle className="w-4 h-4 text-gold" />
                              Suporte
                            </Button>
                          </div>
                        </>
                      ) : (
                        <Button variant="outline" className="w-full gap-3 border-brand-700 text-white hover:bg-brand-800 text-[10px] font-black uppercase tracking-widest h-12 rounded-2xl" asChild>
                          <a href={`/lote/${lot.id}`}>
                            Ver Detalhes do Lote
                            <ArrowRight className="w-4 h-4 text-gold" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {bids.length === 0 && (
        <div className="py-24 text-center space-y-8 bg-brand-900/40 border-2 border-dashed border-brand-800 rounded-[3rem]">
          <div className="w-24 h-24 rounded-3xl bg-brand-800 flex items-center justify-center mx-auto text-gold shadow-2xl rotate-3">
            <Trophy className="size-12" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-widest">Nenhum item encontrado</h3>
            <p className="text-gray-500 font-medium mt-2 max-w-sm mx-auto">Você ainda não possui arremates ou participações registradas nesta categoria.</p>
          </div>
          <Button className="bg-gold text-black hover:bg-gold-light font-black uppercase tracking-widest rounded-2xl h-12 px-8" asChild>
            <a href="/">Explorar Leilões</a>
          </Button>
        </div>
      )}

      {lightboxData.open && (
        <ImageLightbox
          open={lightboxData.open}
          close={() => setLightboxData(prev => ({ ...prev, open: false }))}
          images={lightboxData.images}
          index={lightboxData.index}
        />
      )}

      {paymentData && (
        <WinnerPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          winnerData={paymentData}
        />
      )}

      {selectedContract && (
        <ContractViewer
          isOpen={isContractViewerOpen}
          onClose={() => setIsContractViewerOpen(false)}
          contractData={selectedContract}
        />
      )}

      {selectedSalesNote && (
        <SalesNoteViewer
          isOpen={isSalesNoteOpen}
          onClose={() => setIsSalesNoteOpen(false)}
          data={selectedSalesNote}
        />
      )}

      {isChatOpen && adminId && (
        <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 bg-transparent border-none">
            <DirectChat recipientId={adminId} recipientName="Suporte Mega Leilões" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
