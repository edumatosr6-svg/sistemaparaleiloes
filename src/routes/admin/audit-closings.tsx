import { createFileRoute } from '@tanstack/react-router';
import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Search, 
  Download, 
  FileText, 
  Table as TableIcon, 
  Gavel, 
  User,
  Calendar,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SkeletonPremium } from '@/components/ui/skeleton-premium';

export const Route = createFileRoute('/admin/audit-closings')({
  component: AuditClosingsPage,
});

function AuditClosingsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: winners, isLoading } = useQuery({
    queryKey: ['admin-audit-closings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auction_winners')
        .select(`
          *,
          lot:lots!auction_winners_lot_id_fkey (title, lot_order, auction:auctions(title)),
          profile:profiles (full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as any[];
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
      queryClient.invalidateQueries({ queryKey: ['admin-audit-closings'] });
      toast.success('Status de pagamento atualizado');
    },
    onError: (err: any) => {
      toast.error('Erro ao atualizar status: ' + err.message);
    }
  });

  const filteredWinners = (winners as any[])?.filter(w => {
    const searchLower = searchTerm.toLowerCase();
    return (
      w.lot?.title?.toLowerCase().includes(searchLower) ||
      w.profile?.full_name?.toLowerCase().includes(searchLower) ||
      w.lot?.auction?.title?.toLowerCase().includes(searchLower)
    );
  });

  const exportCSV = () => {
    const winnersData = winners as any[];
    if (!winnersData) return;
    const headers = ['Data', 'Leilão', 'Lote', 'Arrematante', 'Valor Lance', 'Comissão', 'Taxa ADM', 'Total'];
    const rows = winnersData.map(w => [
      format(new Date(w.created_at), 'dd/MM/yyyy HH:mm'),
      w.lot?.auction?.title || '',
      `Lote ${w.lot?.lot_order} - ${w.lot?.title}`,
      w.profile?.full_name || 'N/A',
      w.bid_amount,
      w.commission_amount,
      w.administrative_amount,
      w.final_amount
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `auditoria_fechamento_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Auditoria de Encerramento</h1>
            <p className="text-sm text-slate-500">Relatório detalhado de todos os lotes arrematados.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportCSV} className="text-xs h-9">
              <Download className="w-4 h-4 mr-2" /> Exportar CSV
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 border-b border-slate-100 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Buscar por lote, leilão ou arrematante..." 
                  className="pl-10 h-10 bg-slate-50 border-none focus:ring-1 focus:ring-primary/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4">Data/Hora</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4">Leilão / Lote</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4">Arrematante</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4">Valores</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4">Status Pagamento</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4 text-right">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}><SkeletonPremium className="h-12 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredWinners?.map((winner) => (
                    <TableRow key={winner.id} className="hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900">{format(new Date(winner.created_at), 'dd/MM/yyyy')}</span>
                          <span className="text-[10px] text-slate-500 font-medium">{format(new Date(winner.created_at), 'HH:mm')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col max-w-[250px]">
                          <span className="text-[9px] font-black text-primary uppercase tracking-widest truncate">{winner.lot?.auction?.title}</span>
                          <span className="text-sm font-bold text-slate-900 line-clamp-1">Lote {winner.lot?.lot_order} - {winner.lot?.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <User className="size-4 text-slate-400" />
                          </div>
                          <span className="text-xs font-bold text-slate-700">{winner.profile?.full_name || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex justify-between w-32 text-[9px] text-slate-500">
                            <span>Lance:</span>
                            <span className="font-bold">R$ {winner.bid_amount?.toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="flex justify-between w-32 text-[9px] text-slate-500">
                            <span>Comissão:</span>
                            <span className="font-bold">R$ {winner.commission_amount?.toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="flex justify-between w-32 text-[9px] text-slate-500">
                            <span>Taxa ADM:</span>
                            <span className="font-bold">R$ {winner.administrative_amount?.toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Select 
                          value={winner.escrow_status || 'pending'} 
                          onValueChange={(val) => updateStatusMutation.mutate({ id: winner.id, status: val })}
                        >
                          <SelectTrigger className="h-8 w-32 text-[10px] font-black uppercase tracking-widest border-slate-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="paid">Pago</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                            <SelectItem value="shipped">Enviado</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <span className="text-sm font-black text-slate-900 tabular-nums tracking-tighter">
                          R$ {winner.final_amount?.toLocaleString('pt-BR')}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <Button variant="ghost" size="icon" className="text-slate-400 group-hover:text-primary" asChild>
                          <a href={`/lote/${winner.lot_id}`} target="_blank" rel="noreferrer">
                            <ArrowRight className="size-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
