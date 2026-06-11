import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Search, 
  Plus, 
  Package, 
  Edit3, 
  Trash2,
  Image as ImageIcon,
  MonitorPlay,
  XCircle,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { MultiImageUpload } from '@/components/admin/MultiImageUpload';

export const Route = createFileRoute('/admin/lots')({
  component: LotsManagementPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      status: (search.status as string) || undefined,
      auctionId: (search.auctionId as string) || undefined,
    }
  },
});

function LotsManagementPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { status: statusFilter, auctionId: auctionIdFilter } = Route.useSearch();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    auction_id: auctionIdFilter || '',
    category_id: '',
    starting_price: 0,
    min_increment: 0,
    buyout_price: 0,
    lot_order: 1,
    is_highlight: false,
    hammer_enabled: false,
    buyout_enabled: true,
    image_url: '',
    gallery_urls: [] as string[],
    status: 'pending' as 'pending' | 'active' | 'sold' | 'unsold' | 'cancelled' // pendente, ativo, arrematado, encerrado, cancelado
  });

  const { data: lots, isLoading } = useQuery({
    queryKey: ['admin-lots', auctionIdFilter],
    queryFn: async () => {
      let query = supabase
        .from('lots')
        .select(`
          *,
          auction:auctions(id, title, status),
          category:categories(name)
        `);
      
      if (auctionIdFilter) {
        query = query.eq('auction_id', auctionIdFilter);
      }

      const { data, error } = await query.order('lot_order', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  const { data: auctions } = useQuery({
    queryKey: ['admin-auctions-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('auctions').select('id, title, status').order('title');
      if (error) throw error;
      return data;
    }
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('id, name').order('name');
      if (error) throw error;
      return data;
    }
  });

  const sendToAuditMutation = useMutation({
    mutationFn: async (lot: any) => {
      const { data: existing } = await supabase
        .from('live_auction_control')
        .select('id')
        .eq('auction_id', lot.auction_id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('live_auction_control')
          .update({ 
            current_lot_id: lot.id,
            is_running: false,
            current_lot_started_at: null,
            auctioneer_status: 'idle'
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('live_auction_control')
          .insert({
            auction_id: lot.auction_id,
            current_lot_id: lot.id,
            is_running: false,
            lot_time_limit_seconds: 60
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Lote enviado para o Auditório Live!');
      navigate({ to: '/admin/audit-live' } as any);
    }
  });
  
  const deleteLotMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lots').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lots'] });
      toast.success('Lote excluído com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir lote: ' + error.message);
    }
  });

  const arrematarLotMutation = useMutation({
    mutationFn: async (lot: any) => {
      // Use the RPC for atomic and secure processing
      const { data: highestBid } = await supabase
        .from('bids')
        .select('id')
        .eq('lot_id', lot.id)
        .limit(1);

      if (highestBid && highestBid.length > 0) {
        const { error } = await supabase.rpc('hammer_lot', { p_lot_id: lot.id });
        if (error) throw error;
      } else {
        // No bids - mark as unsold
        const { error: lotError } = await supabase
          .from('lots')
          .update({ status: 'unsold' })
          .eq('id', lot.id);
        if (lotError) throw lotError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lots'] });
      toast.success('Lote processado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao processar lote: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      auction_id: auctionIdFilter || '',
      category_id: '',
      starting_price: 0,
      min_increment: 0,
      buyout_price: 0,
      lot_order: 1,
      is_highlight: false,
      hammer_enabled: false,
      buyout_enabled: true,
      image_url: '',
      gallery_urls: [],
      status: 'pending'
    });
    setEditingLot(null);
  };

  const handleEdit = (lot: any) => {
    setEditingLot(lot);
    setFormData({
      title: lot.title,
      description: lot.description || '',
      auction_id: lot.auction_id,
      category_id: lot.category_id || '',
      starting_price: lot.starting_price,
      min_increment: lot.min_increment || 0,
      buyout_price: lot.buyout_price || 0,
      lot_order: lot.lot_order || 1,
      is_highlight: lot.is_highlight || false,
      hammer_enabled: lot.hammer_enabled || false,
      buyout_enabled: lot.buyout_enabled !== false,
      image_url: lot.image_url || '',
      gallery_urls: lot.gallery_urls || [],
      status: lot.status
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingLot && formData.auction_id !== editingLot.auction_id) {
      if (editingLot.status === 'sold') {
        toast.error('Este lote já foi arrematado e não pode ser movido para outro leilão.');
        return;
      }
      if (editingLot.auction?.status === 'active') {
        const confirmChange = window.confirm('Este lote está vinculado a um leilão ATIVO. Deseja realmente movê-lo para outro evento?');
        if (!confirmChange) return;
      }
    }

    const payload = {
      ...formData,
      auction_id: formData.auction_id || null,
      category_id: formData.category_id || null,
      buyout_price: formData.buyout_price > 0 ? formData.buyout_price : null
    };
    if (editingLot) {
      const { error } = await supabase.from('lots').update(payload).eq('id', editingLot.id);
      if (error) toast.error(error.message);
      else {
        toast.success('Lote atualizado');
        setIsDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ['admin-lots'] });
      }
    } else {
      const { error } = await supabase.from('lots').insert([payload]);
      if (error) toast.error(error.message);
      else {
        toast.success('Lote criado');
        setIsDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ['admin-lots'] });
      }
    }
  };

  const filteredLots = lots?.filter(l => 
    l.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (l.id && l.id.includes(searchTerm))
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Buscar lote..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select 
              value={statusFilter || 'all'} 
              onValueChange={(val) => navigate({ search: { ...Route.useSearch(), status: val === 'all' ? undefined : val } } as any)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="sold">Vendido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-slate-950 hover:bg-slate-900 text-white shadow-xl h-12 px-8 rounded-2xl font-black text-sm uppercase tracking-tight transition-all hover:scale-[1.02]">
            <Plus className="w-5 h-5 mr-2" /> Novo Lote
          </Button>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="w-16 font-bold">Lote</TableHead>
                <TableHead className="font-bold">Produto</TableHead>
                <TableHead className="font-bold">Leilão</TableHead>
                <TableHead className="font-bold text-right">Valor</TableHead>
                <TableHead className="font-bold text-center">Status</TableHead>
                <TableHead className="text-right font-bold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLots?.map(lot => (
                <TableRow key={lot.id} className="hover:bg-slate-50/30">
                  <TableCell className="font-black text-slate-400">#{lot.lot_order}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                        {lot.image_url ? (
                          <img src={lot.image_url} alt="" className="size-full object-cover" />
                        ) : (
                          <div className="size-full flex items-center justify-center text-slate-300"><ImageIcon className="size-4" /></div>
                        )}
                      </div>
                      <span className="font-bold text-slate-700">{lot.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {lot.auction ? (
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-primary tracking-widest leading-tight">{lot.auction.title}</span>
                        <Badge variant="outline" className="w-fit h-4 text-[8px] font-black uppercase mt-1 bg-primary/5 text-primary border-primary/20">Vinculado</Badge>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sem Leilão</span>
                        <Badge variant="outline" className="w-fit h-4 text-[8px] font-black uppercase mt-1 bg-slate-50 text-slate-400 border-slate-200">Disponível</Badge>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-black text-slate-900 tabular-nums">
                    R$ {(lot.current_highest_bid || lot.starting_price)?.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={cn(
                      "uppercase text-[10px] font-black tracking-widest px-2 py-0.5 border-none",
                      lot.status === 'sold' ? "bg-green-600 text-white shadow-sm shadow-green-100" : 
                      lot.status === 'active' ? "bg-blue-600 text-white shadow-sm shadow-blue-100" :
                      "bg-slate-100 text-slate-500"
                    )}>
                      {lot.status === 'sold' ? 'Arrematado' : 
                       lot.status === 'active' ? 'Ativo' : 
                       lot.status === 'pending' ? 'Pendente' : 
                       lot.status === 'unsold' ? 'Encerrado' : 'Cancelado'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {lot.status !== 'sold' && lot.status !== 'unsold' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="size-8 rounded-lg text-green-600 hover:bg-green-50" 
                              onClick={() => { if(confirm('Encerrar este lote agora e declarar vencedor?')) arrematarLotMutation.mutate(lot) }}
                              disabled={arrematarLotMutation.isPending}
                            >
                              <Trophy className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-[10px] font-black uppercase tracking-widest">Arrematar Lote</p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant="ghost" className="size-8 rounded-lg" onClick={() => handleEdit(lot)}>
                            <Edit3 className="size-4 text-slate-400" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-[10px] font-black uppercase tracking-widest">Editar Lote</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="h-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-black text-[10px] uppercase tracking-widest px-3"
                            onClick={() => sendToAuditMutation.mutate(lot)}
                            disabled={sendToAuditMutation.isPending}
                          >
                            <MonitorPlay className="size-3.5 mr-1.5" />
                            Live
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-[10px] font-black uppercase tracking-widest">Enviar para Auditório Live</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant="ghost" className="size-8 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors" onClick={() => { if(confirm('Excluir este lote permanentemente?')) deleteLotMutation.mutate(lot.id) }}>
                            <Trash2 className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-[10px] font-black uppercase tracking-widest">Excluir Lote</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-widest text-slate-900">
              {editingLot ? 'Editar Lote' : 'Cadastrar Novo Lote'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Título do Produto</Label>
                      <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className="h-12 font-bold" />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Descrição</Label>
                      <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[120px]" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Ordem (Lote #)</Label>
                         <Input type="number" value={formData.lot_order} onChange={e => setFormData({...formData, lot_order: parseInt(e.target.value)})} required />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Status</Label>
                         <Select value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                               <SelectItem value="pending">Pendente</SelectItem>
                               <SelectItem value="active">Ativo</SelectItem>
                               <SelectItem value="sold">Arrematado</SelectItem>
                               <SelectItem value="unsold">Encerrado</SelectItem>
                               <SelectItem value="cancelled">Cancelado</SelectItem>
                            </SelectContent>
                         </Select>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Preço de Arremate Antecipado</Label>
                         <Input type="number" value={formData.buyout_price} onChange={e => setFormData({...formData, buyout_price: parseFloat(e.target.value)})} />
                         <p className="text-[9px] text-slate-400 font-medium italic">Valor para compra imediata</p>
                      </div>
                      <div className="flex flex-col justify-center items-center space-y-2 bg-slate-50 rounded-xl border border-slate-100 p-2">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Aceitar Antecipado?</Label>
                         <Switch 
                           checked={formData.buyout_enabled} 
                           onCheckedChange={(val) => setFormData({...formData, buyout_enabled: val})}
                         />
                      </div>
                   </div>
                </div>
                <div className="space-y-4">
                   <ImageUpload label="Imagem de Capa" value={formData.image_url} onChange={url => setFormData({...formData, image_url: url})} />
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Lance Inicial</Label>
                         <Input type="number" value={formData.starting_price} onChange={e => setFormData({...formData, starting_price: parseFloat(e.target.value)})} required />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Incremento</Label>
                         <Input type="number" value={formData.min_increment} onChange={e => setFormData({...formData, min_increment: parseFloat(e.target.value)})} required />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Leilão Vinculado</Label>
                       <Select value={formData.auction_id || 'none'} onValueChange={val => setFormData({...formData, auction_id: val === 'none' ? '' : val})}>
                          <SelectTrigger><SelectValue placeholder="Selecione o leilão" /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="none">Sem Leilão (Reserva)</SelectItem>
                             {auctions?.map(a => (
                               <SelectItem key={a.id} value={a.id}>
                                 <div className="flex items-center justify-between w-full gap-4">
                                   <span>{a.title}</span>
                                   <span className="text-[8px] font-black uppercase opacity-50">
                                      {a.status === 'active' ? 'Ativo' : a.status === 'draft' ? 'Rascunho' : 'Encerrado'}
                                   </span>
                                 </div>
                               </SelectItem>
                             ))}
                         </SelectContent>
                      </Select>
                   </div>
                </div>
             </div>
             <DialogFooter className="pt-6 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl px-8 uppercase font-black text-[10px]">Cancelar</Button>
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-8 uppercase font-black text-[10px] tracking-widest">
                  {editingLot ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

export default LotsManagementPage;
