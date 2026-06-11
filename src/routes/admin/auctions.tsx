import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Search, 
  Plus, 
  Gavel, 
  Edit3, 
  Trash2,
  ChevronDown,
  ChevronRight,
  MonitorPlay,
  XCircle,
  Package,
  Star,
  TrendingUp,
  Clock,
  ArrowRight,
  Play,
  ShieldAlert,
  Calendar,
  Trophy,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { format, differenceInSeconds } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ImageUpload } from '@/components/admin/ImageUpload';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = differenceInSeconds(new Date(targetDate), new Date());
      setTimeLeft(diff > 0 ? diff : 0);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft <= 0) return <span className="text-slate-400 font-bold uppercase text-[9px]">Encerrado</span>;

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex flex-col items-center">
      <span className="text-red-600 font-black tabular-nums text-xs animate-pulse">
        {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
      <span className="text-[8px] font-black uppercase tracking-widest text-red-400">Restante</span>
    </div>
  );
}

function SecurityBidDialog({ 
  isOpen, 
  onClose, 
  lot, 
  onBid 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  lot: any, 
  onBid: (userId: string) => void 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: profiles } = useQuery({
    queryKey: ['admin-profiles-search', searchTerm],
    queryFn: async () => {
      let query = supabase.from('profiles').select('id, full_name, role').order('full_name');
      if (searchTerm) {
        query = query.ilike('full_name', `%${searchTerm}%`);
      }
      const { data, error } = await query.limit(10);
      if (error) throw error;
      return data;
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
            <ShieldAlert className="size-5 text-amber-500" /> Lance de Segurança
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <p className="text-[10px] font-black uppercase text-slate-400">Produto</p>
            <p className="text-sm font-bold text-slate-900">{lot.title}</p>
            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] font-black uppercase text-slate-400">Próximo Lance</span>
              <span className="text-sm font-black text-green-600">R$ {((lot.current_highest_bid || lot.starting_price) + (lot.min_increment || 100)).toLocaleString('pt-BR')}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400">Atribuir a qual usuário?</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input 
                placeholder="Pesquisar usuário..." 
                className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-1 pt-2">
              {profiles?.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => onBid(profile.id)}
                  className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between group"
                >
                  <span className="text-xs font-bold text-slate-700">{profile.full_name || 'Usuário sem nome'}</span>
                  <Badge variant="outline" className="text-[8px] font-black uppercase group-hover:bg-primary group-hover:text-white transition-colors">Selecionar</Badge>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function ReservoirDialog({ 
  isOpen, 
  onClose, 
  onLink 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onLink: (lotId: string) => void 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: poolLots } = useQuery({
    queryKey: ['admin-lots-pool', searchTerm],
    queryFn: async () => {
      let query = supabase.from('lots').select('*').is('auction_id', null).order('created_at', { ascending: false });
      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }
      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data;
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
            <Package className="size-5 text-primary" /> Lotes na Reserva (Sem Leilão)
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input 
              placeholder="Pesquisar lotes disponíveis..." 
              className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {poolLots?.length === 0 ? (
              <div className="text-center py-10 text-slate-400 italic font-medium">Sua reserva está vazia.</div>
            ) : poolLots?.map(lot => (
              <div
                key={lot.id}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                   <div className="size-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-100 shadow-sm">
                      {lot.image_url ? <img src={lot.image_url} className="size-full object-cover" /> : <Package className="size-4 text-slate-300 m-4" />}
                   </div>
                   <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">{lot.title}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lance Inicial: R$ {lot.starting_price.toLocaleString('pt-BR')}</span>
                   </div>
                </div>
                <Button 
                  size="sm" 
                  className="h-8 rounded-lg bg-primary hover:bg-primary/90 text-[10px] font-black uppercase tracking-widest"
                  onClick={() => onLink(lot.id)}
                >
                  Vincular
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const Route = createFileRoute('/admin/auctions')({
  component: AuctionsManagementPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      status: (search.status as string) || undefined,
    }
  },
});

function AuctionRow({ auction, onEdit, onDelete }: { auction: any, onEdit: (a: any) => void, onDelete: (id: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLot, setSelectedLot] = useState<any>(null);
  const [isBidDialogOpen, setIsBidDialogOpen] = useState(false);
  const [isReservoirOpen, setIsReservoirOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: lots } = useQuery({
    queryKey: ['admin-auction-lots-expanded-v2', auction.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lots')
        .select(`
          *,
          bids:bids(
            id,
            amount,
            created_at,
            bid_source,
            manual_bidder_name,
            profiles:user_id(full_name)
          )
        `)
        .eq('auction_id', auction.id)
        .order('lot_order', { ascending: true });
      
      if (error) throw error;
      
      return data.map(lot => ({
        ...lot,
        lastBids: (lot.bids as any[] || [])
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3)
      }));
    },
    enabled: isExpanded,
    refetchInterval: isExpanded ? 5000 : false
  });

  const placeBidMutation = useMutation({
    mutationFn: async ({ lotId, userId, amount }: { lotId: string, userId: string, amount: number }) => {
      const { error } = await supabase.from('bids').insert({
        lot_id: lotId,
        user_id: userId,
        amount: amount
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-auction-lots-expanded-v2', auction.id] });
      toast.success('Lance de segurança realizado!');
      setIsBidDialogOpen(false);
      setSelectedLot(null);
    },
    onError: (err) => {
      toast.error('Erro ao realizar lance: ' + err.message);
    }
  });

  const unlinkLotMutation = useMutation({
    mutationFn: async (lotId: string) => {
      const { error } = await supabase
        .from('lots')
        .update({ auction_id: null })
        .eq('id', lotId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-auction-lots-expanded-v2', auction.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-lots-pool'] });
      toast.success('Lote movido para a reserva!');
    }
  });

  const linkLotMutation = useMutation({
    mutationFn: async (lotId: string) => {
      const { error } = await supabase
        .from('lots')
        .update({ auction_id: auction.id })
        .eq('id', lotId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-auction-lots-expanded-v2', auction.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-lots-pool'] });
      toast.success('Lote vinculado com sucesso!');
    }
  });


  const handleSecurityBid = (lot: any) => {
    setSelectedLot(lot);
    setIsBidDialogOpen(true);
  };

  const isExpired = auction.ends_at && new Date(auction.ends_at) < new Date();

  const translateStatus = (s: string) => {
    const map: any = {
      'active': 'Ativo',
      'draft': 'Rascunho',
      'closed': 'Encerrado',
      'sold': 'Arrematado',
      'unsold': 'Não Vendido',
      'pending': 'Pendente'
    };
    return map[s] || s;
  };

  return (
    <>
      <TableRow className={cn("transition-colors border-b border-slate-100", isExpanded ? "bg-slate-50/50" : "")}>
        <TableCell>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="p-0 size-10 rounded-xl hover:bg-white transition-all">
            {isExpanded ? <ChevronDown className="w-5 h-5 text-primary" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
          </Button>
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-black text-slate-900 uppercase tracking-tight text-sm">{auction.title}</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">ID: {auction.id.slice(0, 8)}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <Calendar className="size-3 text-slate-400" />
                {format(new Date(auction.starts_at), 'dd/MM/yy HH:mm')}
             </div>
             <div className="flex items-center gap-2">
                {auction.type === 'live' ? <MonitorPlay className="size-3 text-amber-500" /> : <Package className="size-3 text-blue-500" />}
                <span className="text-slate-400 uppercase text-[9px] font-bold tracking-widest">{auction.type === 'live' ? 'Auditório' : 'Simultâneo'}</span>
             </div>
          </div>
        </TableCell>
        <TableCell>
           <div className="flex items-center gap-4">
              <Badge className={cn(
                "uppercase font-black text-[9px] border-none px-2 py-0.5",
                auction.status === 'active' ? (isExpired ? "bg-red-600 text-white shadow-lg shadow-red-200" : "bg-green-600 text-white shadow-lg shadow-green-200") : "bg-slate-200 text-slate-500"
              )}>
                {auction.status === 'active' ? (isExpired ? 'Encerrado (Vencido)' : 'Ativo') : auction.status === 'draft' ? 'Rascunho' : 'Finalizado'}
              </Badge>
              {auction.status === 'active' && !isExpired && auction.ends_at && (
                <CountdownTimer targetDate={auction.ends_at} />
              )}
           </div>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
             {(auction.status === 'closed' || auction.status === 'active') && (
               <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  "h-9 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all active:scale-95",
                  auction.status === 'closed' 
                    ? "bg-green-50 text-green-700 hover:bg-green-100 border-green-200" 
                    : "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
                )}
                onClick={async () => {
                  const confirmed = window.confirm(
                    auction.status === 'active' 
                      ? 'Deseja encerrar este leilão AGORA e processar todos os ganhadores dos lotes vinculados?' 
                      : 'Processar ganhadores para todos os lotes deste leilão?'
                  );
                  if (!confirmed) return;

                  toast.promise(
                    (async () => {
                      // Se estiver ativo, encerra primeiro
                      if (auction.status === 'active') {
                        const { error: closeError } = await supabase
                          .from('auctions')
                          .update({ status: 'closed', ends_at: new Date().toISOString() })
                          .eq('id', auction.id);
                        if (closeError) throw closeError;
                      }

                      const { error } = await supabase.rpc('process_auction_winners_v2', { p_auction_id: auction.id });
                      if (error) throw error;
                      queryClient.invalidateQueries({ queryKey: ['admin-auctions-v4'] });
                    })(),
                    {
                      loading: 'Processando lotes...',
                      success: 'Leilão encerrado e ganhadores processados!',
                      error: (err) => 'Erro ao processar: ' + err.message
                    }
                  );
                }}
               >
                  <Trophy className="w-3.5 h-3.5 mr-1.5" /> 
                  {auction.status === 'active' ? 'Fechar e Processar' : 'Processar Ganhadores'}
               </Button>
             )}
             <Link to="/admin/audit-live" search={{ auctionId: auction.id }}>
                <Button variant="outline" size="sm" className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white hover:bg-slate-50 border-slate-200 shadow-sm transition-all active:scale-95">
                   <Play className="w-3.5 h-3.5 mr-1.5 text-amber-500 fill-amber-500" /> Fazer Live
                </Button>
             </Link>
             <Button variant="ghost" size="icon" className="size-9 rounded-xl hover:bg-slate-100 transition-colors" onClick={() => onEdit(auction)}>
                <Edit3 className="size-4 text-slate-400" />
             </Button>
             <Button variant="ghost" size="icon" className="size-9 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors" onClick={() => onDelete(auction.id)}>
                <Trash2 className="size-4" />
             </Button>
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={5} className="bg-slate-100/30 p-8 border-b border-slate-200 shadow-inner">
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                       <Package className="size-4 text-primary" />
                    </div>
                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">Lotes Vinculados ({lots?.length || 0})</h4>
                 </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsReservoirOpen(true)}
                      className="text-[10px] font-black uppercase tracking-widest bg-white hover:bg-slate-50 border-slate-200 rounded-xl"
                    >
                       <Plus className="size-3 mr-2 text-primary" /> Adicionar da Reserva
                    </Button>
                    <Link to="/admin/lots" search={{ auctionId: auction.id }}>
                        <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-xl">
                          Ver Todos Lotes <ArrowRight className="size-3 ml-2" />
                        </Button>
                    </Link>
                  </div>
              </div>
              
              <Table className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-200">
                    <TableHead className="w-16 font-black uppercase text-[9px] tracking-[0.2em] text-slate-400">#</TableHead>
                    <TableHead className="font-black uppercase text-[9px] tracking-[0.2em] text-slate-400">Título do Produto</TableHead>
                    <TableHead className="font-black uppercase text-[9px] tracking-[0.2em] text-slate-400">Status</TableHead>
                    <TableHead className="font-black uppercase text-[9px] tracking-[0.2em] text-slate-400">Ação</TableHead>
                    <TableHead className="text-right font-black uppercase text-[9px] tracking-[0.2em] text-slate-400">Últimos Lances (Tempo Real)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10 font-bold italic text-slate-400">Nenhum lote cadastrado para este evento.</TableCell></TableRow>
                  ) : lots?.map(lot => (
                    <TableRow key={lot.id} className="border-b border-slate-50 group">
                      <TableCell className="font-black text-slate-400 text-xs">#{lot.lot_order}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                           <div className="size-8 rounded-lg bg-slate-100 overflow-hidden border border-slate-100 shrink-0 shadow-sm">
                              {lot.image_url ? <img src={lot.image_url} className="size-full object-cover" /> : <Package className="size-3 text-slate-300 m-2.5" />}
                           </div>
                           <span className="font-bold text-slate-700 text-sm">{lot.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "text-[8px] font-black uppercase tracking-widest border-none px-2",
                          lot.status === 'sold' ? "bg-green-600 text-white" : "bg-blue-600 text-white"
                        )}>{translateStatus(lot.status)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest border-amber-200 text-amber-600 hover:bg-amber-50"
                            onClick={() => handleSecurityBid(lot)}
                          >
                            <ShieldAlert className="size-3 mr-1" /> Lance Seg.
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest border-red-100 text-red-500 hover:bg-red-50"
                            onClick={() => {
                              if(confirm('Mover este lote para a reserva?')) {
                                unlinkLotMutation.mutate(lot.id);
                              }
                            }}
                          >
                            <Trash2 className="size-3 mr-1" /> Remover
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1.5 min-w-[200px]">
                            {lot.lastBids && lot.lastBids.length > 0 ? lot.lastBids.map((bid: any) => {
                                const bidderName = bid.manual_bidder_name || (bid.bid_source && bid.bid_source !== 'online' ? bid.bid_source : bid.profiles?.full_name?.split(' ')[0]) || 'Usuário';
                                return (
                                  <div key={bid.id} className={cn(
                                      "flex items-center justify-between w-full max-w-[250px] p-1.5 rounded-lg border bg-slate-50 border-slate-100"
                                  )}>
                                      <span className="text-[10px] font-black text-slate-700 uppercase leading-none">{bidderName}</span>
                                      <span className="text-[10px] font-black tabular-nums leading-none text-green-600">R$ {bid.amount.toLocaleString('pt-BR')}</span>
                                  </div>
                                );
                            }) : <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest italic">Sem movimentação</span>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TableCell>
        </TableRow>
      )}
      
      {selectedLot && (
        <SecurityBidDialog 
          isOpen={isBidDialogOpen} 
          onClose={() => { setIsBidDialogOpen(false); setSelectedLot(null); }} 
          lot={selectedLot}
          onBid={(userId) => {
            const amount = (selectedLot.current_highest_bid || selectedLot.starting_price) + (selectedLot.min_increment || 100);
            placeBidMutation.mutate({ lotId: selectedLot.id, userId, amount });
          }}
        />
      )}
      <ReservoirDialog 
        isOpen={isReservoirOpen} 
        onClose={() => setIsReservoirOpen(false)} 
        onLink={(lotId) => linkLotMutation.mutate(lotId)}
      />
    </>
  );
}

function AuctionsManagementPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { status: statusFilter } = Route.useSearch();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAuction, setEditingAuction] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    image_url: '',
    starts_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    ends_at: format(new Date(Date.now() + 86400000), "yyyy-MM-dd'T'HH:mm"),
    type: 'live' as 'live' | 'simultaneous',
    status: 'draft' as 'draft' | 'active' | 'closed',
    is_highlight: false,
    require_deposit: false,
    deposit_amount: 100.00,
    commission_rate: 5.00,
    administrative_fee: 0.00,
    streaming_url: '',
    streaming_active: false
  });

  const { data: auctions, isLoading } = useQuery({
    queryKey: ['admin-auctions-v4'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auctions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newAuction: any) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('auctions').insert([{ ...newAuction, created_by: userData.user.id }]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-auctions-v4'] });
      toast.success('Leilão criado com sucesso');
      setIsDialogOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      // If we are closing the auction, we should process winners for all lots that are not yet sold/unsold
      if (data.status === 'closed') {
        const { data: auctionLots, error: lotsError } = await supabase
          .from('lots')
          .select('*, auction:auctions(commission_rate, administrative_fee)')
          .eq('auction_id', id)
          .eq('status', 'active');
        
        if (lotsError) throw lotsError;

        for (const lot of (auctionLots || [])) {
          // Get the highest bid for each active lot
          const { data: highestBid } = await supabase
            .from('bids')
            .select('*')
            .eq('lot_id', lot.id)
            .order('amount', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (highestBid) {
            const bidAmount = Number(highestBid.amount);
            const commissionRate = Number(lot.auction?.commission_rate || 5);
            const adminFee = Number(lot.auction?.administrative_fee || 0);
            const commissionAmount = (bidAmount * commissionRate) / 100;
            const finalAmount = bidAmount + commissionAmount + adminFee;

            await supabase.from('auction_winners').insert({
              lot_id: lot.id,
              user_id: highestBid.user_id,
              bid_amount: bidAmount,
              commission_amount: commissionAmount,
              administrative_amount: adminFee,
              final_amount: finalAmount,
              escrow_status: 'pending',
              manual_bidder_name: highestBid.manual_bidder_name,
              manual_bidder_phone: highestBid.manual_bidder_phone
            });

            await supabase.from('lots').update({ status: 'sold' }).eq('id', lot.id);
          } else {
            // No bids, mark as unsold
            await supabase.from('lots').update({ status: 'unsold' }).eq('id', lot.id);
          }
        }
      }

      const { error } = await supabase.from('auctions').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-auctions-v4'] });
      toast.success('Leilão atualizado e lotes processados com sucesso');
      setIsDialogOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('auctions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-auctions-v4'] });
      toast.success('Leilão e todos os dados vinculados foram excluídos com sucesso');
    },
    onError: (error: any) => {
      console.error('Erro ao deletar leilão:', error);
      toast.error('Não foi possível excluir o leilão: ' + (error.message || 'Erro desconhecido'));
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      image_url: '',
      starts_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      ends_at: format(new Date(Date.now() + 86400000), "yyyy-MM-dd'T'HH:mm"),
      type: 'live',
      status: 'draft',
      is_highlight: false,
      require_deposit: false,
      deposit_amount: 100.00,
      commission_rate: 5.00,
      administrative_fee: 0.00,
      streaming_url: '',
      streaming_active: false
    });
    setEditingAuction(null);
  };

  const handleEdit = (auction: any) => {
    setEditingAuction(auction);
    setFormData({
      title: auction.title,
      description: auction.description || '',
      location: auction.location || '',
      image_url: auction.image_url || '',
      starts_at: format(new Date(auction.starts_at), "yyyy-MM-dd'T'HH:mm"),
      ends_at: auction.ends_at ? format(new Date(auction.ends_at), "yyyy-MM-dd'T'HH:mm") : '',
      type: auction.type,
      status: auction.status,
      is_highlight: auction.is_highlight || false,
      require_deposit: auction.require_deposit || false,
      deposit_amount: Number(auction.deposit_amount) || 100.00,
      commission_rate: Number(auction.commission_rate) || 5.00,
      administrative_fee: Number(auction.administrative_fee) || 0.00,
      streaming_url: auction.streaming_url || '',
      streaming_active: auction.streaming_active || false
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAuction) {
      updateMutation.mutate({ id: editingAuction.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filtered = auctions?.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = auctions?.filter(a => a.status === 'active' && (!a.ends_at || new Date(a.ends_at) > new Date())).length || 0;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 leading-none mb-1">Leilões & Eventos</h1>
            <p className="text-xs text-slate-500 font-medium italic">Gestão operacional de leilões e disputas em tempo real</p>
          </div>
          <div className="flex gap-3">
             <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-slate-950 hover:bg-slate-900 text-white shadow-xl h-12 px-8 rounded-2xl font-black text-sm uppercase tracking-tight transition-all hover:scale-[1.02]">
                <Plus className="w-5 h-5 mr-2" /> Criar Evento
             </Button>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[950px] max-h-[95vh] overflow-y-auto rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-widest text-slate-900">
                {editingAuction ? 'Editar Leilão' : 'Criar Novo Leilão'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="py-4 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Título do Evento</Label>
                    <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className="h-12 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Localização</Label>
                    <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Ex: Virtual / São Paulo" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Início</Label>
                      <Input type="datetime-local" value={formData.starts_at} onChange={e => setFormData({...formData, starts_at: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Fim (Opcional)</Label>
                      <Input type="datetime-local" value={formData.ends_at} onChange={e => setFormData({...formData, ends_at: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Tipo</Label>
                      <Select value={formData.type} onValueChange={(val: any) => setFormData({...formData, type: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="live">Auditório (Live)</SelectItem>
                          <SelectItem value="simultaneous">Simultâneo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Status</Label>
                      <Select value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Rascunho</SelectItem>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="closed">Finalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Comissão (%)</Label>
                        <Input type="number" value={formData.commission_rate} onChange={e => setFormData({...formData, commission_rate: parseFloat(e.target.value)})} />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Taxa Admin (R$)</Label>
                        <Input type="number" value={formData.administrative_fee} onChange={e => setFormData({...formData, administrative_fee: parseFloat(e.target.value)})} />
                     </div>
                  </div>

                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-4">
                    <div className="flex items-center justify-between">
                       <Label className="text-[10px] font-black uppercase text-blue-900">Exigir Caução?</Label>
                       <Switch checked={formData.require_deposit} onCheckedChange={val => setFormData({...formData, require_deposit: val})} />
                    </div>
                    {formData.require_deposit && (
                      <Input type="number" placeholder="Valor da Caução" value={formData.deposit_amount} onChange={e => setFormData({...formData, deposit_amount: parseFloat(e.target.value)})} />
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <ImageUpload label="Imagem de Capa" value={formData.image_url} onChange={url => setFormData({...formData, image_url: url})} />
                  
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                       <Label className="text-[10px] font-black uppercase text-slate-600">Transmitir Vídeo?</Label>
                       <Switch checked={formData.streaming_active} onCheckedChange={val => setFormData({...formData, streaming_active: val})} />
                    </div>
                    <Input placeholder="URL da Transmissão" value={formData.streaming_url} onChange={e => setFormData({...formData, streaming_url: e.target.value})} />
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-6 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl px-8 font-black uppercase text-xs">Cancelar</Button>
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-10 h-12 font-black uppercase text-sm tracking-tight shadow-lg" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingAuction ? 'Salvar Alterações' : 'Criar Evento'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group overflow-hidden relative">
              <div className="relative z-10">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Leilões Ativos</p>
                 <h3 className="text-3xl font-black text-green-600 tabular-nums leading-none tracking-tighter">{activeCount}</h3>
              </div>
              <div className="size-14 rounded-2xl bg-green-50 flex items-center justify-center relative z-10 transition-transform group-hover:scale-110">
                 <TrendingUp className="size-7 text-green-600" />
              </div>
              <div className="absolute -right-4 -bottom-4 size-24 bg-green-50/50 rounded-full blur-2xl" />
           </div>
           <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group overflow-hidden relative">
              <div className="relative z-10">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Cadastrados</p>
                 <h3 className="text-3xl font-black text-slate-900 tabular-nums leading-none tracking-tighter">{auctions?.length || 0}</h3>
              </div>
              <div className="size-14 rounded-2xl bg-slate-50 flex items-center justify-center relative z-10 transition-transform group-hover:scale-110">
                 <Package className="size-7 text-slate-400" />
              </div>
           </div>
           <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group overflow-hidden relative">
              <div className="relative z-10">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Encerrados</p>
                 <h3 className="text-3xl font-black text-slate-500 tabular-nums leading-none tracking-tighter">{auctions?.filter(a => a.status === 'closed' || (a.ends_at && new Date(a.ends_at) < new Date())).length || 0}</h3>
              </div>
              <div className="size-14 rounded-2xl bg-red-50 flex items-center justify-center relative z-10 transition-transform group-hover:scale-110">
                 <XCircle className="size-7 text-red-400" />
              </div>
           </div>
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden no-print">
          <CardContent className="p-0">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/30">
                 <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                       placeholder="Filtrar por nome do evento..." 
                       className="pl-10 h-12 bg-white border-slate-200 rounded-xl focus:ring-slate-900"
                       value={searchTerm} 
                       onChange={e => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <div className="w-full md:w-auto">
                    <Select value={statusFilter || 'all'} onValueChange={(val) => navigate({ search: { status: val === 'all' ? undefined : val } as any })}>
                       <SelectTrigger className="w-full md:w-[200px] h-12 bg-white rounded-xl">
                          <SelectValue placeholder="Status" />
                       </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="active">Ativos</SelectItem>
                          <SelectItem value="closed">Encerrados/Finalizados</SelectItem>
                          <SelectItem value="draft">Rascunhos</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
              </div>
             
             <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-200">
                    <TableHead className="w-16"></TableHead>
                    <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] py-5">Nome do Evento</TableHead>
                    <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em]">Tipo</TableHead>
                    <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em]">Status Operacional</TableHead>
                    <TableHead className="text-right font-black text-slate-400 uppercase text-[10px] tracking-[0.2em]">Ações Rápidas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold italic text-slate-400 animate-pulse">Carregando relação de leilões...</TableCell></TableRow>
                  ) : filtered?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold italic text-slate-400">Nenhum leilão encontrado para os termos pesquisados.</TableCell></TableRow>
                  ) : filtered?.map(auction => <AuctionRow key={auction.id} auction={auction} onEdit={handleEdit} onDelete={(id) => { if(confirm('Excluir este evento permanentemente?')) deleteMutation.mutate(id) }} />)}
                </TableBody>
             </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}