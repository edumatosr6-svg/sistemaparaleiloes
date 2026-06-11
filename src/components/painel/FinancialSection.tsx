import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  FileText, 
  CheckCircle2, 
  Clock,
  Download,
  Loader2,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DepositModal } from "@/components/leilao/DepositModal";
import { ContractViewer } from "./ContractViewer";
import { SalesNoteViewer } from "./SalesNoteViewer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import React from 'react';

export function FinancialSection() {
  const { user } = useAuth();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isContractViewerOpen, setIsContractViewerOpen] = useState(false);
  const [isSalesNoteOpen, setIsSalesNoteOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [selectedSalesNote, setSelectedSalesNote] = useState<any>(null);
  const [autoDownload, setAutoDownload] = useState(false);
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [realContracts, setRealContracts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    pendingPayments: 0,
    totalWon: 0,
    pendingCaucao: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFinancialData() {
      if (!user) return;
      
      try {
        setLoading(true);
        // Fetch site config
        const { data: configData } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'site_config')
          .maybeSingle();
        setSiteConfig(configData?.value || {});

        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*, profiles_private(*)')
          .eq('id', user.id)
          .single();
        
        const flattenedProfile = profileData ? {
          ...profileData,
          ...(profileData as any).profiles_private
        } : null;
        setProfile(flattenedProfile);

        // Fetch transactions (caucao)
        const { data: caucaoData } = await supabase
          .from('caucao')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setTransactions(caucaoData || []);

        // Fetch won lots for total won and pending
        const { data: wonLots } = await supabase
          .from('auction_winners')
          .select('*, lot:lots!auction_winners_lot_id_fkey (*, auction:auctions(*))')
          .eq('user_id', user.id);
        
        setRealContracts(wonLots || []);
        
        const total = wonLots?.reduce((acc, lot) => acc + Number(lot.final_amount), 0) || 0;
        const pending = wonLots?.filter(lot => lot.escrow_status === 'pending')
                                .reduce((acc, lot) => acc + Number(lot.final_amount), 0) || 0;
        const pendingCaucao = caucaoData?.filter(c => c.status === 'pending')
                                        .reduce((acc, c) => acc + Number(c.amount), 0) || 0;
        
        setStats({
          totalWon: total,
          pendingPayments: pending,
          pendingCaucao: pendingCaucao
        });
      } catch (error) {
        console.error("Error fetching financial data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFinancialData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-2xl text-white">Financeiro</h1>
          <p className="text-sm text-gray-400">Gestão de caução, pagamentos e documentos fiscais.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 border-brand-700 text-white hover:bg-brand-800 font-black uppercase tracking-widest text-[10px] h-10 px-4 rounded-xl">
            <ArrowDownCircle className="w-4 h-4 text-gold" />
            Solicitar Reembolso
          </Button>
          <Button className="gap-2 bg-gold text-black hover:bg-gold-light font-black uppercase tracking-widest text-[10px] h-10 px-4 rounded-xl" onClick={() => setIsDepositModalOpen(true)}>
            <ArrowUpCircle className="w-4 h-4" />
            Adicionar Caução
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-premium bg-brand-900/80 backdrop-blur-sm border border-brand-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">Saldo Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white tabular-nums tracking-tighter italic">
              R$ {(profile?.caucao_balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest">Disponível para lances</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-premium bg-brand-900/80 backdrop-blur-sm border border-brand-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Pagamentos Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-400 tabular-nums tracking-tighter italic">
              R$ {stats.pendingPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest">Lotes aguardando pagamento</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-premium bg-brand-900/80 backdrop-blur-sm border border-brand-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">Cauções em Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-500 tabular-nums tracking-tighter italic">
              R$ {stats.pendingCaucao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest">Aguardando aprovação admin</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-premium bg-brand-900/80 backdrop-blur-sm border border-brand-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-brand-400 uppercase tracking-[0.2em]">Total Arrematado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white tabular-nums tracking-tighter italic">
              R$ {stats.totalWon.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest">Total investido na plataforma</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="section-title text-lg text-white">Histórico de Transações</h2>
        <div className="bg-brand-900/50 rounded-xl border border-brand-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-brand-800 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  <th className="px-6 py-4 italic">Transação</th>
                  <th className="px-6 py-4 italic">Data</th>
                  <th className="px-6 py-4 italic">Método</th>
                  <th className="px-6 py-4 italic">Valor</th>
                  <th className="px-6 py-4 italic">Status</th>
                  <th className="px-6 py-4 text-right italic">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-800">
                {transactions.length > 0 ? (
                  transactions.map((tx, i) => (
                    <tr key={tx.id} className="hover:bg-brand-800/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <ArrowUpCircle className={cn("w-4 h-4", tx.status === 'approved' ? "text-green-400" : "text-gold")} />
                          <span className="font-black text-white uppercase italic text-sm">
                            Depósito Caução
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 font-medium">
                        {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 font-medium">
                        {tx.mercadopago_payment_id ? 'MercadoPago' : 'Transferência'}
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-green-400 italic tabular-nums">
                        R$ {Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border",
                           tx.status === "approved" ? "bg-green-500/10 text-green-400 border-green-500/20" : 
                           tx.status === "pending" ? "bg-gold/10 text-gold border-gold/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                        )}>
                          {tx.status === 'approved' ? 'Aprovado' : tx.status === 'pending' ? 'Pendente' : 'Reembolsado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white hover:bg-brand-700 transition-all">
                          <Download className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-black uppercase tracking-widest text-xs">
                      Nenhuma transação encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="section-title text-lg text-white">Contratos</h2>
          <div className="bg-brand-900/50 rounded-xl border border-brand-700 divide-y divide-brand-800">
            {realContracts.length > 0 ? (
              realContracts.map((item) => (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-brand-800/30 transition-colors group gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-800 rounded-lg group-hover:bg-brand-700 transition-colors">
                      <Trophy className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-white uppercase italic">Contrato #{item.id.slice(0, 8)}</h3>
                        <span className={cn(
                          "text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border",
                          item.escrow_status === "paid" ? "bg-green-500/10 text-green-400 border-green-500/20" : 
                          item.escrow_status === "under_review" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          item.escrow_status === "pending" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                          "bg-gray-500/10 text-gray-400 border-gray-500/20"
                        )}>
                          {item.escrow_status === 'paid' ? 'Pago' : 
                           item.escrow_status === 'under_review' ? 'Em Análise' :
                           item.escrow_status === 'pending' ? 'Pendente' : 
                           item.escrow_status === 'shipped' ? 'Enviado' : 'Cancelado'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{item.lot?.title}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-[10px] font-black uppercase tracking-widest border-brand-700 text-gray-400 hover:text-gold hover:border-gold"
                      title="Baixar Contrato PDF"
                      onClick={() => {
                        setSelectedContract({
                          winnerId: item.id,
                          number: item.id.slice(0, 8),
                          date: new Date(item.created_at).toLocaleDateString('pt-BR'),
                          lotName: item.lot?.title,
                          userName: profile?.full_name || user?.email,
                          amount: item.final_amount,
                          bidAmount: item.bid_amount,
                          commissionAmount: item.commission_amount,
                          administrativeAmount: item.administrative_amount,
                          logoUrl: siteConfig?.logo_url,
                          siteName: siteConfig?.name,
                          auctioneerName: siteConfig?.auctioneer_name,
                          auctioneerRegistration: siteConfig?.auctioneer_registration,
                          logoHeight: siteConfig?.logo_height
                        });
                        setAutoDownload(true);
                        setIsContractViewerOpen(true);
                      }}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-[10px] font-black uppercase tracking-widest border-brand-700 text-gray-400 hover:text-white hover:bg-brand-700"
                      onClick={() => {
                        setSelectedContract({
                          winnerId: item.id,
                          number: item.id.slice(0, 8),
                          date: new Date(item.created_at).toLocaleDateString('pt-BR'),
                          lotName: item.lot?.title,
                          userName: profile?.full_name || user?.email,
                          amount: item.final_amount,
                          bidAmount: item.bid_amount,
                          commissionAmount: item.commission_amount,
                          administrativeAmount: item.administrative_amount,
                          logoUrl: siteConfig?.logo_url,
                          siteName: siteConfig?.name,
                          auctioneerName: siteConfig?.auctioneer_name,
                          auctioneerRegistration: siteConfig?.auctioneer_registration,
                          logoHeight: siteConfig?.logo_height
                        });
                        setAutoDownload(false);
                        setIsContractViewerOpen(true);
                      }}
                    >
                      Visualizar
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 text-xs font-black uppercase tracking-widest">
                Nenhum contrato gerado.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="section-title text-lg text-white">Notas de Venda</h2>
          <div className="bg-brand-900/50 rounded-xl border border-brand-700 divide-y divide-brand-800">
            {realContracts.length > 0 ? (
              realContracts.map((item) => (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-brand-800/30 transition-colors group gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-800 rounded-lg group-hover:bg-brand-700 transition-colors">
                      <FileText className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-white uppercase italic">Nota de Venda #{item.id.slice(0, 8)}</h3>
                        <span className={cn(
                          "text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border",
                          item.escrow_status === "paid" ? "bg-green-500/10 text-green-400 border-green-500/20" : 
                          item.escrow_status === "under_review" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          item.escrow_status === "pending" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                          "bg-gray-500/10 text-gray-400 border-gray-500/20"
                        )}>
                          {item.escrow_status === 'paid' ? 'Pago' : 
                           item.escrow_status === 'under_review' ? 'Em Análise' :
                           item.escrow_status === 'pending' ? 'Pendente' : 
                           item.escrow_status === 'shipped' ? 'Enviado' : 'Cancelado'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{item.lot?.title}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-[10px] font-black uppercase tracking-widest border-brand-700 text-gray-400 hover:text-white hover:bg-brand-700"
                    onClick={() => {
                      setSelectedSalesNote({
                        winnerId: item.id,
                        date: new Date(item.created_at).toLocaleDateString('pt-BR'),
                        lotTitle: item.lot?.title,
                        lotOrder: item.lot?.lot_order,
                        auctionTitle: item.lot?.auction?.title,
                        userName: profile?.full_name || user?.email,
                        userCpfCnpj: profile?.cpf_cnpj,
                        userAddress: profile?.address,
                        bidAmount: item.bid_amount,
                        commissionAmount: item.commission_amount,
                        commissionRate: item.lot?.auction?.commission_rate || 5,
                        administrativeAmount: item.administrative_amount,
                        finalAmount: item.final_amount,
                        logoUrl: siteConfig?.logo_url,
                        siteName: siteConfig?.name,
                        auctioneerName: siteConfig?.auctioneer_name,
                        auctioneerRegistration: siteConfig?.auctioneer_registration,
                        logoHeight: siteConfig?.logo_height
                      });
                      setIsSalesNoteOpen(true);
                    }}
                  >
                    Visualizar
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 text-xs font-black uppercase tracking-widest">
                Nenhuma nota fiscal gerada.
              </div>
            )}
          </div>
        </div>
      </div>

      <DepositModal 
        isOpen={isDepositModalOpen} 
        onClose={() => setIsDepositModalOpen(false)} 
      />
      {selectedContract && (
        <ContractViewer 
          isOpen={isContractViewerOpen} 
          onClose={() => setIsContractViewerOpen(false)} 
          contractData={selectedContract} 
          autoDownload={autoDownload}
        />
      )}
      {selectedSalesNote && (
        <SalesNoteViewer 
          isOpen={isSalesNoteOpen} 
          onClose={() => setIsSalesNoteOpen(false)} 
          data={selectedSalesNote} 
        />
      )}
    </div>
  );
}
