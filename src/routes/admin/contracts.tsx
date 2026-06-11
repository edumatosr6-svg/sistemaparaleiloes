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
import { FileText, Download, Eye, Search, Filter } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ContractViewer } from '@/components/painel/ContractViewer';
import { SalesNoteViewer } from '@/components/painel/SalesNoteViewer';
import { SkeletonPremium } from '@/components/ui/skeleton-premium';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/admin/contracts')({
  component: ContractsAdminPage,
});

function ContractsAdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isContractOpen, setIsContractOpen] = useState(false);
  const [autoDownload, setAutoDownload] = useState(false);
  const [selectedSalesNote, setSelectedSalesNote] = useState<any>(null);
  const [isSalesNoteOpen, setIsSalesNoteOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: winners, isLoading } = useQuery({
    queryKey: ['admin-winners'],
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

  const { data: siteConfig } = useQuery({
    queryKey: ['site-config'],
    queryFn: async () => {
      const { data } = await supabase.from('system_settings').select('value').eq('key', 'site_config').maybeSingle();
      return data?.value as any;
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
      queryClient.invalidateQueries({ queryKey: ['admin-winners'] });
      toast.success('Status atualizado com sucesso');
    }
  });

  const filteredWinners = winners?.filter(w => 
    w.lot?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.id.includes(searchTerm)
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
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Contratos e Documentos</h1>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Buscar por lote, arrematante ou ID..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-brand-900 border border-brand-800 rounded-3xl overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-brand-950">
              <TableRow className="hover:bg-transparent border-brand-800">
                <TableHead className="text-gray-400 font-black uppercase text-[10px] tracking-widest">ID / Data</TableHead>
                <TableHead className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Lote / Leilão</TableHead>
                <TableHead className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Arrematante</TableHead>
                <TableHead className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Valor Final</TableHead>
                <TableHead className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="text-right text-gray-400 font-black uppercase text-[10px] tracking-widest">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWinners?.map((winner) => (
                <TableRow key={winner.id} className="border-brand-800 hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium text-gray-300">
                    <div className="flex flex-col">
                      <span className="text-xs font-black">#{winner.id.slice(0, 8)}</span>
                      <span className="text-[10px] text-gray-500">{new Date(winner.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white line-clamp-1">{winner.lot?.title}</span>
                      <span className="text-[10px] text-brand-500 uppercase tracking-widest">{winner.lot?.auction?.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-200">{winner.profile?.full_name || 'N/A'}</span>
                      <span className="text-[10px] text-gray-500">{(winner.profile as any)?.profiles_private?.cpf_cnpj || 'Sem CPF/CNPJ'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-white tabular-nums">
                    R$ {winner.final_amount.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-none",
                      winner.escrow_status === 'paid' ? "bg-green-600 text-white" : 
                      winner.escrow_status === 'pending' ? "bg-gold text-black" : 
                      "bg-gray-700 text-gray-300"
                    )}>
                      {winner.escrow_status === 'paid' ? 'Pago' : 
                       winner.escrow_status === 'pending' ? 'Pendente' : winner.escrow_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="size-8 rounded-lg border-brand-800 text-brand-400 hover:text-gold hover:border-gold"
                        title="Baixar Contrato PDF"
                        onClick={() => {
                          setSelectedContract({
                            winnerId: winner.id,
                            number: winner.id.slice(0, 8),
                            date: new Date(winner.created_at).toLocaleDateString('pt-BR'),
                            lotName: winner.lot?.title,
                            userName: winner.profile?.full_name,
                            amount: winner.final_amount,
                            bidAmount: winner.bid_amount,
                            commissionAmount: winner.commission_amount,
                            administrativeAmount: winner.administrative_amount,
                            commissionRate: winner.lot?.auction?.commission_rate,
                            logoUrl: siteConfig?.logo_url,
                            siteName: siteConfig?.name,
                            auctioneerName: siteConfig?.auctioneer_name,
                            auctioneerRegistration: siteConfig?.auctioneer_registration,
                            logoHeight: siteConfig?.logo_height
                          });
                          setAutoDownload(true);
                          setIsContractOpen(true);
                        }}
                      >
                        <Download className="size-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="size-8 rounded-lg border-brand-800 text-brand-400 hover:text-gold hover:border-gold"
                        title="Ver Nota de Venda"
                        onClick={() => {
                          setSelectedSalesNote({
                            winnerId: winner.id,
                            date: new Date(winner.created_at).toLocaleDateString('pt-BR'),
                            lotTitle: winner.lot?.title,
                            lotOrder: winner.lot?.lot_order,
                            auctionTitle: winner.lot?.auction?.title,
                            userName: winner.profile?.full_name,
                            userCpfCnpj: (winner.profile as any)?.profiles_private?.cpf_cnpj,
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
                        <FileText className="size-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="size-8 rounded-lg border-brand-800 text-brand-400 hover:text-gold hover:border-gold"
                        title="Baixar Nota de Venda PDF"
                        onClick={() => {
                          setSelectedSalesNote({
                            winnerId: winner.id,
                            date: new Date(winner.created_at).toLocaleDateString('pt-BR'),
                            lotTitle: winner.lot?.title,
                            lotOrder: winner.lot?.lot_order,
                            auctionTitle: winner.lot?.auction?.title,
                            userName: winner.profile?.full_name,
                            userCpfCnpj: (winner.profile as any)?.profiles_private?.cpf_cnpj,
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
                          setAutoDownload(true);
                          setIsSalesNoteOpen(true);
                        }}
                      >
                        <Download className="size-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="size-8 rounded-lg border-brand-800 text-brand-400 hover:text-gold hover:border-gold"
                        title="Ver Contrato"
                        onClick={() => {
                          setSelectedContract({
                            winnerId: winner.id,
                            number: winner.id.slice(0, 8),
                            date: new Date(winner.created_at).toLocaleDateString('pt-BR'),
                            lotName: winner.lot?.title,
                            userName: winner.profile?.full_name,
                            amount: winner.final_amount,
                            bidAmount: winner.bid_amount,
                            commissionAmount: winner.commission_amount,
                            administrativeAmount: winner.administrative_amount,
                            commissionRate: winner.lot?.auction?.commission_rate,
                            logoUrl: siteConfig?.logo_url,
                            siteName: siteConfig?.name,
                            auctioneerName: siteConfig?.auctioneer_name,
                            auctioneerRegistration: siteConfig?.auctioneer_registration,
                            logoHeight: siteConfig?.logo_height
                          });
                          setAutoDownload(false);
                          setIsContractOpen(true);
                        }}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedContract && (
        <ContractViewer 
          isOpen={isContractOpen} 
          onClose={() => setIsContractOpen(false)} 
          contractData={selectedContract} 
          autoDownload={autoDownload}
        />
      )}
      {selectedSalesNote && (
        <SalesNoteViewer 
          isOpen={isSalesNoteOpen} 
          onClose={() => setIsSalesNoteOpen(false)} 
          data={selectedSalesNote} 
          autoDownload={autoDownload}
        />
      )}
    </AdminLayout>
  );
}