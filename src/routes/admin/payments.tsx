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
import { CreditCard, Search, Image as ImageIcon, CheckCircle2, XCircle, Clock, Eye, MessageCircle, Phone, ExternalLink, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DirectChat } from '@/components/painel/DirectChat';
import { SalesNoteViewer } from '@/components/painel/SalesNoteViewer';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { SkeletonPremium } from '@/components/ui/skeleton-premium';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute('/admin/payments')({
  component: PaymentsAdminPage,
});

function PaymentsAdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<any>(null);
  const [selectedReceiptData, setSelectedReceiptData] = useState<any>(null);
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch site config for receipt
  useQuery({
    queryKey: ['site-config-payments'],
    queryFn: async () => {
      const { data } = await supabase.from('system_settings').select('value').eq('key', 'site_config').maybeSingle();
      setSiteConfig(data?.value || {});
      return data?.value || {};
    }
  });

  const { data: payments, isLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auction_winners')
        .select(`
          *,
          lot:lots!auction_winners_lot_id_fkey (*, auction:auctions(*)),
          profile:profiles (*, profiles_private(*))
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, userId, lotId, reason }: { id: string, status: string, userId?: string, lotId?: string, reason?: string }) => {
      if (status === 'paid') {
        const { error } = await supabase.rpc('confirm_winner_payment', { p_winner_id: id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('auction_winners')
          .update({ 
            escrow_status: status,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
        
        if (error) throw error;

        // Manual notification for non-standard statuses (like rejection)
        if (userId && status === 'pending') {
          await supabase.from('notifications').insert({
            user_id: userId,
            title: "❌ Comprovante Recusado",
            message: reason || "Seu comprovante de pagamento não pôde ser validado. Por favor, envie novamente ou entre em contato com o suporte.",
            type: "payment_rejected"
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      toast.success('Status de pagamento atualizado com sucesso');
    }
  });

  const filtered = payments?.filter(p => 
    p.lot?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.includes(searchTerm)
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <SkeletonPremium className="h-12 w-1/4" />
          <SkeletonPremium className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Gestão de Pagamentos</h1>
          <div className="flex flex-col md:flex-row items-center gap-3">
            <Button 
              variant="outline" 
              className="bg-blue-50 text-blue-700 border-blue-200 font-black uppercase text-[10px] h-10 px-4 rounded-xl hover:bg-blue-100"
              onClick={async () => {
                const winner = payments?.[0];
                if (!winner) return toast.error("Nenhum arremate encontrado para testar.");
                
                try {
                  // Fix: Query params should be appended to the path if needed, 
                  // but here we just pass the topic and id in the body or fix the call.
                  // Supabase invoke doesn't take 'query' as a separate option.
                  const { error } = await supabase.functions.invoke('mercadopago-webhook', {
                    method: 'POST',
                    body: {
                      topic: 'payment',
                      id: 'test_payment_' + Date.now()
                    }
                  });
                  toast.success("Webhook disparado! (Simulação enviada)");
                  setTimeout(() => queryClient.invalidateQueries({ queryKey: ['admin-payments'] }), 1500);
                } catch (err: any) {
                  toast.error("Erro ao testar webhook: " + err.message);
                }
              }}
            >
              Testar Webhook MP
            </Button>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Buscar por lote, arrematante ou ID..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Aguardando Pgto</p>
                 <h3 className="text-3xl font-black text-slate-400 tabular-nums leading-none tracking-tighter">
                   {payments?.filter(p => p.escrow_status === 'pending').length || 0}
                 </h3>
              </div>
              <div className="size-14 rounded-2xl bg-slate-50 flex items-center justify-center">
                 <Clock className="size-7 text-slate-400" />
              </div>
           </div>
           <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Em Análise</p>
                 <h3 className="text-3xl font-black text-blue-500 tabular-nums leading-none tracking-tighter">
                   {payments?.filter(p => p.escrow_status === 'under_review').length || 0}
                 </h3>
              </div>
              <div className="size-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                 <Search className="size-7 text-blue-500" />
              </div>
           </div>
           <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Confirmados Hoje</p>
                 <h3 className="text-3xl font-black text-green-600 tabular-nums leading-none tracking-tighter">
                   {payments?.filter(p => p.escrow_status === 'paid' && format(new Date(p.updated_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length || 0}
                 </h3>
              </div>
              <div className="size-14 rounded-2xl bg-green-50 flex items-center justify-center">
                 <CheckCircle2 className="size-7 text-green-600" />
              </div>
           </div>
           <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Recebido</p>
                 <h3 className="text-2xl font-black text-slate-900 tabular-nums leading-none tracking-tighter">
                   R$ {payments?.filter(p => p.escrow_status === 'paid').reduce((acc, p) => acc + Number(p.final_amount), 0).toLocaleString('pt-BR')}
                 </h3>
              </div>
              <div className="size-14 rounded-2xl bg-slate-50 flex items-center justify-center">
                 <CreditCard className="size-7 text-slate-400" />
              </div>
           </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest py-4">ID / Data</TableHead>
                <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest py-4">Lote / Evento</TableHead>
                <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest py-4">Arrematante / Contato</TableHead>
                <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest py-4">Forma de Pgto</TableHead>
                <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest py-4">Valor Total</TableHead>
                <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest py-4">Comprovante</TableHead>
                <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest py-4">Recibo (Nota)</TableHead>
                <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest py-4 text-right">Situação</TableHead>
                <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest py-4 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((item) => {
                const phoneNumber = item.manual_bidder_phone || (item.profile as any)?.profiles_private?.phone;
                const cleanPhone = phoneNumber?.replace(/\D/g, '');
                const whatsappUrl = cleanPhone ? `https://wa.me/55${cleanPhone}` : null; // Assuming Brazil +55 if not present

                return (
                  <TableRow key={item.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-900">#{item.id.slice(0, 8)}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 line-clamp-1">{item.lot?.title}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{item.lot?.auction?.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-700">{item.manual_bidder_name || item.profile?.full_name || 'N/A'}</span>
                        {cleanPhone ? (
                          <div className="flex flex-wrap gap-2">
                            <a 
                              href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(`Olá ${item.manual_bidder_name || item.profile?.full_name || 'Arrematante'}! Confirmamos seu pagamento do lote ${item.lot?.title}. Em breve daremos andamento no envio.`)}`}
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-1.5 text-[10px] font-black text-green-600 hover:text-green-700 transition-colors uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-lg border border-green-100"
                            >
                              <Phone className="size-3" />
                              Notificar Pgto
                            </a>
                            <a 
                              href={`https://wa.me/55${cleanPhone}`}
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-widest px-2 py-0.5 rounded-lg border border-slate-100"
                            >
                              Chat
                            </a>
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-bold uppercase italic">Sem telefone</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-600 border-slate-200">
                        {item.payment_method === 'pix' ? 'PIX' : 
                         item.payment_method === 'bank_transfer' ? 'Transf. Bancária' : 
                         item.payment_method === 'mercadopago' ? 'Mercado Pago' : 
                         'Não informado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-black text-slate-900 tabular-nums">
                      R$ {Number(item.final_amount).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {item.payment_proof_url ? (
                        <Button variant="outline" size="sm" className="h-8 gap-2 rounded-lg text-[10px] font-black uppercase tracking-widest" asChild>
                          <a href={item.payment_proof_url} target="_blank" rel="noreferrer">
                            <ImageIcon className="size-3 text-primary" />
                            Ver Comprovante
                          </a>
                        </Button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-black uppercase italic">Não enviado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-2 rounded-lg text-[10px] font-black uppercase tracking-widest"
                        onClick={() => {
                          setSelectedReceiptData({
                            winnerId: item.id,
                            date: new Date(item.created_at).toLocaleDateString('pt-BR'),
                            lotTitle: item.lot?.title,
                            lotOrder: item.lot?.lot_order,
                            auctionTitle: item.lot?.auction?.title,
                            userName: item.profile?.full_name || item.manual_bidder_name || "Usuário",
                            userCpfCnpj: (item.profile as any)?.profiles_private?.cpf_cnpj || item.manual_bidder_document,
                            userAddress: (item.profile as any)?.profiles_private?.address,
                            bidAmount: Number(item.bid_amount),
                            commissionAmount: Number(item.commission_amount),
                            commissionRate: Number(item.lot?.auction?.commission_rate || 5),
                            administrativeAmount: Number(item.administrative_amount),
                            finalAmount: Number(item.final_amount),
                            logoUrl: siteConfig?.logo_url,
                            siteName: siteConfig?.name,
                            auctioneerName: siteConfig?.auctioneer_name,
                            auctioneerRegistration: siteConfig?.auctioneer_registration,
                            logoHeight: siteConfig?.logo_height,
                            payment_proof_url: item.payment_proof_url
                          });
                          setIsReceiptOpen(true);
                        }}
                      >
                        <FileText className="size-3 text-gold" />
                        Ver Recibo
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={item.escrow_status || 'pending'} 
                        onValueChange={(val) => updateStatusMutation.mutate({ id: item.id, status: val })}
                      >
                        <SelectTrigger className={cn(
                          "h-8 w-40 text-[10px] font-black uppercase tracking-widest",
                          item.escrow_status === 'paid' ? "text-green-600 border-green-200 bg-green-50" :
                          item.escrow_status === 'pending' ? "text-amber-600 border-amber-200 bg-amber-50" :
                          item.escrow_status === 'under_review' ? "text-blue-600 border-blue-200 bg-blue-50" :
                          item.escrow_status === 'cancelled' ? "text-red-600 border-red-200 bg-red-50" :
                          item.escrow_status === 'shipped' ? "text-purple-600 border-purple-200 bg-purple-50" :
                          "text-slate-600 border-slate-200"
                        )}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Aguardando Pgto</SelectItem>
                          <SelectItem value="under_review">Em Análise</SelectItem>
                          <SelectItem value="paid">Confirmado / Pago</SelectItem>
                          <SelectItem value="shipped">Lote Enviado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                          <SelectItem value="refunded">Estornado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.escrow_status === 'under_review' && (
                          <Button 
                            size="sm" 
                            className="h-8 bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[9px] tracking-widest rounded-lg"
                            onClick={() => {
                              if (confirm("Deseja CONFIRMAR MANUALMENTE este pagamento? Isso notificará o usuário.")) {
                                updateStatusMutation.mutate({ 
                                  id: item.id, 
                                  status: 'paid',
                                  userId: item.user_id || undefined,
                                  lotId: item.lot_id || undefined
                                });
                              }
                            }}
                          >
                            <CheckCircle2 className="size-3 mr-1.5" />
                            Confirmar Manual
                          </Button>
                        )}
                        {item.escrow_status === 'under_review' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 border-red-200 text-red-600 hover:bg-red-50 font-black uppercase text-[9px] tracking-widest rounded-lg"
                            onClick={() => {
                              const reason = prompt("Deseja RECUSAR este comprovante? Informe o motivo (opcional):", "Seu comprovante de pagamento não pôde ser validado.");
                              if (reason !== null) {
                                updateStatusMutation.mutate({ 
                                  id: item.id, 
                                  status: 'pending',
                                  userId: item.user_id || undefined,
                                  reason: reason
                                });
                              }
                            }}
                          >
                            <XCircle className="size-3 mr-1.5" />
                            Recusar
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="size-8 rounded-lg border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-600"
                          title="Chat com Arrematante"
                          onClick={() => {
                            if (item.user_id) {
                              setActiveChatUser({
                                id: item.user_id,
                                name: item.manual_bidder_name || item.profile?.full_name
                              });
                              setIsChatOpen(true);
                            } else {
                              toast.error("Este arremate não possui usuário vinculado para chat.");
                            }
                          }}
                        >
                          <MessageCircle className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-400 font-bold uppercase text-xs tracking-widest">
                    Nenhum pagamento encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

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

      {selectedReceiptData && (
        <SalesNoteViewer 
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          data={selectedReceiptData}
        />
      )}
    </AdminLayout>
  );
}