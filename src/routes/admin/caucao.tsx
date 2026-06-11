import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  FileText,
  Loader2,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/admin/caucao')({
  component: CaucaoManagementPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      auctionId: (search.auctionId as string) || undefined,
      status: (search.status as string) || undefined,
    }
  },
});

function CaucaoManagementPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { auctionId, status: statusFilter } = Route.useSearch();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: caucoes, isLoading, refetch } = useQuery({
    queryKey: ['admin-caucoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('caucao')
        .select(`
          *,
          profiles:user_id(full_name),
          auctions:auction_id(title)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, userId, amount }: { id: string, status: string, userId: string, amount: number }) => {
      if (status === 'approved') {
        const { error } = await supabase.rpc('approve_caucao', { p_caucao_id: id });
        if (error) throw error;
      } else if (status === 'refunded') {
        const { error } = await supabase.rpc('refund_caucao_v2', { p_caucao_id: id });
        if (error) throw error;
      } else {
        // For 'rejected' or others without complex atomic logic, just update status
        const { error } = await supabase
          .from('caucao')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-caucoes'] });
      toast.success('Status da caução atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  });

  const filteredCaucoes = caucoes?.filter(c => {
    const matchesSearch = 
      (c.profiles as any)?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.auctions as any)?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAuction = !auctionId || c.auction_id === auctionId;
    const matchesStatus = !statusFilter || c.status === statusFilter;
    
    return matchesSearch && matchesAuction && matchesStatus;
  });

  const stats = {
    totalCustody: caucoes?.reduce((acc, curr) => curr.status === 'approved' ? acc + Number(curr.amount) : acc, 0) || 0,
    pendingCount: caucoes?.filter(c => c.status === 'pending').length || 0,
    refundedMonth: caucoes?.filter(c => c.status === 'refunded').length || 0 // Simplifying for now
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Buscar por usuário ou leilão..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select 
                value={statusFilter || 'all'} 
                onValueChange={(val) => {
                  navigate({
                    search: {
                      status: val === 'all' ? undefined : val
                    }
                  } as any);
                }}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="refunded">Reembolsado</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => refetch()}
                disabled={isLoading}
                title="Recarregar"
              >
                <RotateCcw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              </Button>
              
              {(auctionId || statusFilter) && (
                <Link to="/admin/caucao">
                  <Button variant="outline" size="icon" title="Limpar todos os filtros">
                    <XCircle className="w-4 h-4 text-red-500" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-blue-50/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total em Custódia</p>
                  <p className="text-2xl font-bold text-blue-700">R$ {stats.totalCustody.toLocaleString('pt-BR')}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-amber-50/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pendentes de Aprovação</p>
                  <p className="text-2xl font-bold text-amber-700">{stats.pendingCount}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-green-50/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Reembolsados / Outros</p>
                  <p className="text-2xl font-bold text-green-700">{stats.refundedMonth}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl text-green-600">
                  <RotateCcw className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Histórico de Cauções</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Leilão</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Comprovante</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCaucoes?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{(item.profiles as any)?.full_name || 'Usuário Desconhecido'}</p>
                          <p className="text-[10px] text-gray-400">{(item.profiles as any)?.full_name ? 'ID: ' + item.user_id.slice(0, 8) : ''}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {(item.auctions as any)?.title || 'Global'}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-gray-900">R$ {Number(item.amount).toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {format(new Date(item.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "text-[10px] uppercase font-bold",
                          item.status === 'approved' ? "bg-green-500 text-white" : 
                          item.status === 'pending' ? "bg-amber-500 text-white" : 
                          item.status === 'rejected' ? "bg-red-500 text-white" : "bg-gray-400 text-white"
                        )}>
                          {item.status === 'approved' ? 'Aprovado' : 
                           item.status === 'pending' ? 'Pendente' : 
                           item.status === 'rejected' ? 'Rejeitado' : 'Reembolsado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.proof_url ? (
                          <Button variant="ghost" size="sm" className="text-xs h-8" asChild>
                            <a href={item.proof_url} target="_blank" rel="noreferrer" className="flex items-center">
                              <FileText className="w-3.5 h-3.5 mr-2" /> Ver Anexo
                            </a>
                          </Button>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">Sem anexo</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {item.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 border-green-200 text-green-700 hover:bg-green-50"
                              onClick={() => updateStatusMutation.mutate({ 
                                id: item.id, 
                                status: 'approved',
                                userId: item.user_id,
                                amount: Number(item.amount)
                              })}
                              disabled={updateStatusMutation.isPending}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Confirmar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 border-red-200 text-red-700 hover:bg-red-50"
                              onClick={() => updateStatusMutation.mutate({ 
                                id: item.id, 
                                status: 'rejected',
                                userId: item.user_id,
                                amount: Number(item.amount)
                              })}
                              disabled={updateStatusMutation.isPending}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Recusar
                            </Button>
                          </>
                        )}
                        {item.status === 'approved' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8"
                            onClick={() => updateStatusMutation.mutate({ 
                              id: item.id, 
                              status: 'refunded',
                              userId: item.user_id,
                              amount: -Number(item.amount) // Refund should probably subtract from balance
                            })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reembolsar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCaucoes?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                        Nenhuma caução encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
