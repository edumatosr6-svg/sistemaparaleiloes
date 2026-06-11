import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Search, 
  Package, 
  TrendingUp, 
  Users, 
  Gavel, 
  DollarSign,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/admin/reports')({
  component: ReportsPage,
});

function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [auctionFilter, setAuctionFilter] = useState<string>('all');

  const { data: auctions } = useQuery({
    queryKey: ['admin-auctions-list-reports'],
    queryFn: async () => {
      const { data, error } = await supabase.from('auctions').select('id, title').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: salesReport, isLoading } = useQuery({
    queryKey: ['admin-sales-report', statusFilter, auctionFilter],
    queryFn: async () => {
      let query = supabase
        .from('lots')
        .select(`
          *,
          auction:auctions(title, status, ends_at),
          winner:auction_winners(
            bid_amount,
            commission_amount,
            administrative_amount,
            final_amount,
            escrow_status,
            profiles:user_id(full_name, email)
          )
        `);

      if (statusFilter === 'sold') {
        query = query.eq('status', 'sold');
      } else if (statusFilter === 'unsold') {
        query = query.eq('status', 'unsold');
      }

      if (auctionFilter !== 'all') {
        query = query.eq('auction_id', auctionFilter);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    }
  });

  const filteredLots = salesReport?.filter(lot => 
    lot.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    lot.lot_order?.toString().includes(searchTerm)
  );

  const stats = {
    totalSold: salesReport?.filter(l => l.status === 'sold').length || 0,
    totalValue: salesReport?.reduce((acc, lot) => {
      const winner = Array.isArray(lot.winner) ? lot.winner[0] : null;
      return acc + (Number(winner?.bid_amount) || 0);
    }, 0) || 0,
    totalCommission: salesReport?.reduce((acc, lot) => {
      const winner = Array.isArray(lot.winner) ? lot.winner[0] : null;
      return acc + (Number(winner?.commission_amount) || 0);
    }, 0) || 0,
    totalPending: salesReport?.filter(l => l.status === 'active' || l.status === 'pending').length || 0
  };

  const exportPDF = () => {
    window.print();
  };

  return (
    <AdminLayout>
      <div className="space-y-8 print:p-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">Relatório de Vendas e Arremates</h1>
            <p className="text-xs text-slate-500 font-medium italic">Gestão completa de resultados e produtos vendidos</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportPDF} variant="outline" className="rounded-xl border-slate-200 bg-white shadow-sm font-bold text-xs uppercase tracking-widest">
              <Download className="w-4 h-4 mr-2" /> Exportar PDF / Imprimir
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Arrematado" value={stats.totalSold} icon={CheckCircle2} color="text-green-600" bgColor="bg-green-50" />
          <StatCard title="Volume de Vendas" value={`R$ ${stats.totalValue.toLocaleString('pt-BR')}`} icon={DollarSign} color="text-blue-600" bgColor="bg-blue-50" />
          <StatCard title="Comissão Total" value={`R$ ${stats.totalCommission.toLocaleString('pt-BR')}`} icon={TrendingUp} color="text-gold" bgColor="bg-amber-50" />
          <StatCard title="Lotes em Aberto" value={stats.totalPending} icon={Clock} color="text-slate-400" bgColor="bg-slate-50" />
        </div>

        {/* Filters */}
        <Card className="border-none shadow-sm bg-white rounded-[2rem] no-print">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Buscar por lote ou produto..." 
                  className="pl-10 h-12 bg-slate-50 border-transparent rounded-xl focus:ring-slate-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Select value={auctionFilter} onValueChange={setAuctionFilter}>
                  <SelectTrigger className="w-full md:w-[250px] h-12 bg-slate-50 border-transparent rounded-xl font-bold">
                    <SelectValue placeholder="Todos os Leilões" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Leilões</SelectItem>
                    {auctions?.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] h-12 bg-slate-50 border-transparent rounded-xl font-bold">
                    <SelectValue placeholder="Filtrar Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="sold">Apenas Vendidos</SelectItem>
                    <SelectItem value="unsold">Não Vendidos</SelectItem>
                    <SelectItem value="active">Em Disputa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                <TableHead className="w-16 font-black uppercase text-[10px] tracking-widest text-slate-400">Lote</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Produto</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Leilão</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Comprador</TableHead>
                <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-slate-400">Valor Final</TableHead>
                <TableHead className="text-center font-black uppercase text-[10px] tracking-widest text-slate-400">Status</TableHead>
                <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-slate-400 no-print">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20 font-bold italic text-slate-400 animate-pulse">Carregando dados do relatório...</TableCell></TableRow>
              ) : filteredLots?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20 font-bold italic text-slate-400">Nenhum resultado encontrado para os filtros aplicados.</TableCell></TableRow>
              ) : (
                filteredLots?.map(lot => {
                  const winner = Array.isArray(lot.winner) ? lot.winner[0] : null;
                  return (
                    <TableRow key={lot.id} className="hover:bg-slate-50/30 transition-colors border-b border-slate-50">
                      <TableCell className="font-black text-slate-400">#{lot.lot_order}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-100 shrink-0">
                            {lot.image_url ? (
                              <img src={lot.image_url} alt="" className="size-full object-cover" />
                            ) : (
                              <div className="size-full flex items-center justify-center"><Package className="size-4 text-slate-300" /></div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700 leading-none mb-1">{lot.title}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">ID: {lot.id.slice(0,8)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[10px] text-slate-500 uppercase font-black tracking-tight max-w-[150px] truncate">
                        {lot.auction?.title || 'Sem Leilão'}
                      </TableCell>
                      <TableCell>
                        {winner ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700 text-xs uppercase">{(winner.profiles as any)?.full_name || 'Usuário'}</span>
                            <span className="text-[9px] text-slate-400 italic">{(winner.profiles as any)?.email}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest italic">Sem Arremate</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className={cn(
                            "font-black text-sm tabular-nums",
                            lot.status === 'sold' ? "text-green-600" : "text-slate-400"
                          )}>
                            R$ {(winner?.bid_amount || lot.current_highest_bid || lot.starting_price)?.toLocaleString('pt-BR')}
                          </span>
                          {winner && (
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                              + R$ {Number(winner.commission_amount).toLocaleString('pt-BR')} (taxas)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn(
                          "uppercase text-[9px] font-black tracking-widest border-none px-2.5 py-1",
                          lot.status === 'sold' ? "bg-green-600 text-white shadow-lg shadow-green-500/20" : 
                          lot.status === 'unsold' ? "bg-slate-400 text-white" : "bg-blue-500 text-white animate-pulse"
                        )}>
                          {lot.status === 'sold' ? 'ARREMATADO' : lot.status === 'unsold' ? 'ENCERRADO' : 'EM DISPUTA'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right no-print">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="icon" variant="ghost" className="size-8 rounded-xl hover:bg-slate-100 transition-all" asChild>
                            <Link to="/admin/lots" search={{ auctionId: lot.auction_id }}>
                              <ArrowRight className="size-4 text-slate-400" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AdminLayout>
  );
}

function StatCard({ title, value, icon: Icon, color, bgColor }: any) {
  return (
    <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden group">
      <CardContent className="p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
            <h3 className={cn("text-2xl font-black tracking-tighter tabular-nums", color)}>{value}</h3>
          </div>
          <div className={cn("size-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", bgColor)}>
            <Icon className={cn("size-6", color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}