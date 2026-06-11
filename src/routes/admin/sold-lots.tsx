import { createFileRoute } from '@tanstack/react-router';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Search, Filter, Trophy, User, ArrowRight, Image as ImageIcon, ShieldCheck, MessageCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DirectChat } from '@/components/painel/DirectChat';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ContractViewer } from '@/components/painel/ContractViewer';
import { SalesNoteViewer } from '@/components/painel/SalesNoteViewer';
import { SkeletonPremium } from '@/components/ui/skeleton-premium';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';

export const Route = createFileRoute('/admin/sold-lots')({
  component: SoldLotsAdminPage,
});

function SoldLotsAdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'sold' | 'unsold'>('sold');
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isContractOpen, setIsContractOpen] = useState(false);
  const [selectedSalesNote, setSelectedSalesNote] = useState<any>(null);
  const [isSalesNoteOpen, setIsSalesNoteOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: siteConfig } = useQuery({
    queryKey: ['site-config'],
    queryFn: async () => {
      const { data } = await supabase.from('system_settings').select('value').eq('key', 'site_config').maybeSingle();
      return data?.value as any;
    }
  });

  const { data: soldLots, isLoading: isLoadingSold } = useQuery({
    queryKey: ['admin-sold-lots-v2'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auction_winners')
        .select(`
          *,
          lot:lots!auction_winners_lot_id_fkey (*, auction:auctions(*)),
          profile:profiles (*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: unsoldLots, isLoading: isLoadingUnsold } = useQuery({
    queryKey: ['admin-unsold-lots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lots')
        .select('*, auction:auctions(*)')
        .eq('status', 'unsold')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase
        .from('auction_winners')
        .update({ escrow_status: status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sold-lots-v2'] });
      toast.success('Status atualizado com sucesso');
    }
  });

  const filteredSold = soldLots?.filter(w => 
    w.lot?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.manual_bidder_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.id.includes(searchTerm)
  );

  const filteredUnsold = unsoldLots?.filter(l => 
    l.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.auction?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLoading = activeTab === 'sold' ? isLoadingSold : isLoadingUnsold;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Auditoria de Vendas</h1>
            <p className="text-xs text-slate-500 font-medium">Verificação de lotes arrematados e não vendidos.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full sm:w-auto">
              <TabsList className="bg-slate-200/50 p-1 rounded-xl">
                <TabsTrigger value="sold" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">
                  <Trophy className="size-3 mr-2 text-green-600" /> Vendidos
                </TabsTrigger>
                <TabsTrigger value="unsold" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">
                  <XCircle className="size-3 mr-2 text-red-500" /> Não Vendidos
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Pesquisar..." 
                className="pl-10 h-10 bg-white border-slate-200 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-8 space-y-4">
              <SkeletonPremium className="h-12 w-full" />
              <SkeletonPremium className="h-12 w-full" />
              <SkeletonPremium className="h-12 w-full" />
            </div>
          ) : activeTab === 'sold' ? (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest py-4">Data</TableHead>
                  <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest py-4">Lote / Leilão</TableHead>
                  <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest py-4">Arrematante</TableHead>
                  <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest py-4 text-right">Valor Final</TableHead>
                  <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest py-4 text-center">Status</TableHead>
                  <TableHead className="text-right text-slate-400 font-black uppercase text-[10px] tracking-widest py-4">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSold?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400 font-bold uppercase text-xs">Nenhum arremate encontrado.</TableCell></TableRow>
                ) : filteredSold?.map((winner) => (
                  <TableRow key={winner.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">{format(new Date(winner.created_at), 'dd/MM/yy')}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{format(new Date(winner.created_at), 'HH:mm')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col max-w-[200px]">
                        <span className="text-sm font-bold text-slate-900 line-clamp-1">{winner.lot?.title}</span>
                        <span className="text-[9px] text-primary font-black uppercase tracking-widest truncate">{winner.lot?.auction?.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <User className="size-3 text-slate-400" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-700 truncate">{winner.manual_bidder_name || winner.profile?.full_name || 'N/A'}</span>
                          {winner.payment_proof_url && (
                            <a href={winner.payment_proof_url} target="_blank" rel="noreferrer" className="text-[8px] text-primary font-black uppercase hover:underline">Ver Comprovante</a>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-slate-900 tabular-nums text-right">
                      R$ {Number(winner.final_amount).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Select 
                          value={winner.escrow_status || 'pending'} 
                          onValueChange={(val) => updateStatusMutation.mutate({ id: winner.id, status: val })}
                        >
                          <SelectTrigger className="h-7 w-28 text-[9px] font-black uppercase tracking-widest border-slate-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="paid">Pago</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="size-7 rounded-lg border-slate-200 text-slate-400 hover:text-blue-600"
                          onClick={() => {
                            if (winner.user_id) {
                              setActiveChatUser({ id: winner.user_id, name: winner.manual_bidder_name || winner.profile?.full_name });
                              setIsChatOpen(true);
                            } else {
                              toast.error("Arremate manual (sem usuário vinculado).");
                            }
                          }}
                        >
                          <MessageCircle className="size-3.5" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="size-7 rounded-lg border-slate-200 text-slate-400 hover:text-primary"
                          onClick={() => {
                            setSelectedSalesNote({
                              winnerId: winner.id,
                              date: new Date(winner.created_at).toLocaleDateString('pt-BR'),
                              lotTitle: winner.lot?.title,
                              lotOrder: winner.lot?.lot_order,
                              auctionTitle: winner.lot?.auction?.title,
                              userName: winner.manual_bidder_name || winner.profile?.full_name,
                              userCpfCnpj: winner.manual_bidder_document || (winner.profile as any)?.profiles_private?.cpf_cnpj,
                              userAddress: (winner.profile as any)?.profiles_private?.address,
                              bidAmount: winner.bid_amount,
                              commissionAmount: winner.commission_amount,
                              commissionRate: winner.lot?.auction?.commission_rate || 5,
                              administrativeAmount: winner.administrative_amount,
                              finalAmount: winner.final_amount,
                              logoUrl: siteConfig?.logo_url,
                              siteName: siteConfig?.name,
                              auctioneerName: siteConfig?.auctioneer_name,
                              auctioneerRegistration: siteConfig?.auctioneer_registration,
                              logoHeight: siteConfig?.logo_height
                            });
                            setIsSalesNoteOpen(true);
                          }}
                        >
                          <FileText className="size-3.5" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className={cn(
                            "size-7 rounded-lg border-slate-200",
                            winner.digital_signature_url ? "text-green-600 bg-green-50" : "text-slate-400"
                          )}
                          onClick={() => {
                            setSelectedContract({
                              winnerId: winner.id,
                              number: winner.id.slice(0, 8),
                              date: new Date(winner.created_at).toLocaleDateString('pt-BR'),
                              lotName: winner.lot?.title,
                              userName: winner.manual_bidder_name || winner.profile?.full_name,
                              amount: winner.final_amount,
                              bidAmount: winner.bid_amount,
                              commissionAmount: winner.commission_amount,
                              administrativeAmount: winner.administrative_amount,
                              commissionRate: winner.lot?.auction?.commission_rate,
                              logoUrl: siteConfig?.logo_url,
                              siteName: siteConfig?.name,
                              auctioneerName: siteConfig?.auctioneer_name,
                              auctioneerRegistration: siteConfig?.auctioneer_registration,
                              logoHeight: siteConfig?.logo_height,
                              digitalSignatureUrl: winner.digital_signature_url,
                              digitallySignedAt: winner.digitally_signed_at
                            });
                            setIsContractOpen(true);
                          }}
                        >
                          {winner.digital_signature_url ? <ShieldCheck className="size-3.5" /> : <Eye className="size-3.5" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest py-4">Lote</TableHead>
                  <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest py-4">Leilão</TableHead>
                  <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest py-4">Preço Inicial</TableHead>
                  <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest py-4">Atualizado em</TableHead>
                  <TableHead className="text-right text-slate-400 font-black uppercase text-[10px] tracking-widest py-4">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnsold?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-400 font-bold uppercase text-xs">Nenhum lote não vendido.</TableCell></TableRow>
                ) : filteredUnsold?.map((lot) => (
                  <TableRow key={lot.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                         <div className="size-8 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                           {lot.image_url ? <img src={lot.image_url} className="size-full object-cover" /> : <ImageIcon className="size-4 text-slate-300 m-2" />}
                         </div>
                         <span className="text-sm font-bold text-slate-900">{lot.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-black uppercase text-primary tracking-widest">{lot.auction?.title}</span>
                    </TableCell>
                    <TableCell className="font-black text-slate-600 tabular-nums">
                      R$ {Number(lot.starting_price).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-[10px] text-slate-500 font-bold uppercase">
                      {format(new Date(lot.updated_at), 'dd/MM/yy HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase tracking-widest" asChild>
                         <a href={`/lote/${lot.id}`} target="_blank" rel="noreferrer">Ver Lote <ArrowRight className="size-3 ml-1" /></a>
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {selectedContract && (
        <ContractViewer 
          isOpen={isContractOpen} 
          onClose={() => setIsContractOpen(false)} 
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

      {activeChatUser && (
        <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 bg-transparent border-none">
            <DirectChat 
              recipientId={activeChatUser.id} 
              recipientName={activeChatUser.name} 
            />
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
}