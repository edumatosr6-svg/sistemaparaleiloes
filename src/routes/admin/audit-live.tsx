import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Play, Pause, SkipForward, Gavel, Users, Clock, MonitorPlay, 
  MessageSquare, Shield, Volume2, AlertCircle, TrendingUp, 
  Settings, Save, RefreshCcw, UserPlus, Zap, XCircle,
  Phone, Mic, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createFileRoute } from '@tanstack/react-router';
import { LivePlayer } from '@/components/leilao/LivePlayer';


export const Route = createFileRoute('/admin/audit-live')({
  component: AuditLivePage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      auctionId: (search.auctionId as string) || undefined,
    }
  },
});

function AuditLivePage() {
  const queryClient = useQueryClient();
  const { auctionId: auctionIdSearch } = Route.useSearch();
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(auctionIdSearch || null);
  const [manualBidName, setManualBidName] = useState('');
  const [manualBidAmount, setManualBidAmount] = useState('');
  const [manualBidUserId, setManualBidUserId] = useState<string | null>(null);
  const [bidSource, setBidSource] = useState('Mesa 1');
  const [streamingUrl, setStreamingUrl] = useState('');
  const [timerMinutes, setTimerMinutes] = useState('0');
  const [timerSeconds, setTimerSeconds] = useState('60');
  const [transitionMessage, setTransitionMessage] = useState('Aguarde o próximo lote...');
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [localTimeRemaining, setLocalTimeRemaining] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  
  const { data: activeAuctions } = useQuery({
    queryKey: ['live-active-auctions'],
    queryFn: async () => {
      // Mostrar todos os eventos (rascunho, ativos e encerrados) para permitir abertura de qualquer um
      const { data, error } = await supabase.from('auctions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users-search', userSearchTerm],
    queryFn: async () => {
      let query = supabase.from('profiles').select('id, full_name, email').order('full_name');
      if (userSearchTerm) {
        query = query.or(`full_name.ilike.%${userSearchTerm}%,email.ilike.%${userSearchTerm}%`);
      }
      const { data, error } = await query.limit(5);
      if (error) throw error;
      return data;
    },
    enabled: showUserSelector
  });

  const { data: initialAuctionControl, isLoading: isLoadingControl } = useQuery({
    queryKey: ['auction-control-initial', selectedAuctionId],
    queryFn: async () => {
      if (!selectedAuctionId) return null;
      let { data, error } = await supabase
        .from('live_auction_control')
        .select('*, current_lot:lots!current_lot_id(*)')
        .eq('auction_id', selectedAuctionId)
        .maybeSingle();
      
      if (!data && !error) {
        const { data: newData, error: insertError } = await supabase
          .from('live_auction_control')
          .insert({ auction_id: selectedAuctionId })
          .select('*, current_lot:lots!current_lot_id(*)')
          .single();
        if (insertError) throw insertError;
        return newData;
      }
      if (error) throw error;
      return data;
    },
    enabled: !!selectedAuctionId,
  });

  const { data: initialLots } = useQuery({
    queryKey: ['live-lots-initial', selectedAuctionId],
    queryFn: async () => {
      if (!selectedAuctionId) return [];
      const { data, error } = await supabase
        .from('lots')
        .select('*')
        .eq('auction_id', selectedAuctionId)
        .order('lot_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedAuctionId
  });

  const [auctionControl, setAuctionControl] = useState<any>(null);
  const [lots, setLots] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'out_of_sync' | 'checking'>('checking');
  const [showReconciliationLogs, setShowReconciliationLogs] = useState(false);

  const { data: reconciliationLogs, refetch: fetchLogs } = useQuery({
    queryKey: ['reconciliation-logs', selectedAuctionId],
    queryFn: async () => {
      if (!selectedAuctionId) return [];
      const { data, error } = await supabase
        .from('reconciliation_logs')
        .select('*, lots(title)')
        .eq('auction_id', selectedAuctionId)
        .order('resolved_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedAuctionId && showReconciliationLogs,
  });

  const { data: discrepancies, refetch: checkSync } = useQuery({
    queryKey: ['check-bid-sync', selectedAuctionId],
    queryFn: async () => {
      if (!selectedAuctionId) return [];
      const { data, error } = await supabase
        .from('lots')
        .select(`
          id, 
          title, 
          current_highest_bid, 
          bids(amount)
        `)
        .eq('auction_id', selectedAuctionId);
      
      if (error) throw error;
      
      // Client-side validation of sync status
      const issues = data.filter((lot: any) => {
        const maxBid = lot.bids?.length > 0 ? Math.max(...lot.bids.map((b: any) => Number(b.amount))) : null;
        return Math.abs(Number(lot.current_highest_bid || 0) - Number(maxBid || 0)) > 0.01;
      });
      
      return issues;
    },
    enabled: !!selectedAuctionId,
  });

  useEffect(() => {
    if (discrepancies) {
      setSyncStatus(discrepancies.length > 0 ? 'out_of_sync' : 'synced');
    }
  }, [discrepancies]);

  useEffect(() => {
    if (initialAuctionControl) setAuctionControl(initialAuctionControl);
  }, [initialAuctionControl]);

  useEffect(() => {
    if (initialLots) setLots(initialLots);
  }, [initialLots]);

  useEffect(() => {
    if (!selectedAuctionId) return;

    const channel = supabase
      .channel(`admin-live-updates:${selectedAuctionId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'live_auction_control', 
        filter: `auction_id=eq.${selectedAuctionId}` 
      }, async (payload) => {
        const newControl = payload.new as any;
        setAuctionControl((prev: any) => {
          const updated = { ...prev, ...newControl };
          // Se o lote mudou, precisamos recarregar os dados do lote para ter o objeto current_lot completo
          if (newControl.current_lot_id && newControl.current_lot_id !== prev?.current_lot_id) {
            supabase.from('lots').select('*').eq('id', newControl.current_lot_id).single().then(({ data }) => {
              setAuctionControl((current: any) => ({ ...current, current_lot: data }));
            });
          }
          return updated;
        });
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'lots', 
        filter: `auction_id=eq.${selectedAuctionId}` 
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          const updatedLot = payload.new as any;
          setLots(prev => prev.map(l => l.id === updatedLot.id ? { ...l, ...updatedLot } : l));
          setAuctionControl((current: any) => {
            if (current?.current_lot?.id === updatedLot.id) {
              return { ...current, current_lot: { ...current.current_lot, ...updatedLot } };
            }
            return current;
          });
        } else {
          queryClient.invalidateQueries({ queryKey: ['live-lots-initial', selectedAuctionId] });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedAuctionId, queryClient]);

  const { data: initialBids } = useQuery({
    queryKey: ['recent-bids-initial', auctionControl?.current_lot_id],
    queryFn: async () => {
      if (!auctionControl?.current_lot_id) return [];
      const { data, error } = await supabase
        .from('bids')
        .select('*, profiles(full_name)')
        .eq('lot_id', auctionControl.current_lot_id)
        .order('amount', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!auctionControl?.current_lot_id,
  });

  const [recentBids, setRecentBids] = useState<any[]>([]);

  useEffect(() => {
    if (initialBids) setRecentBids(initialBids);
  }, [initialBids]);

  useEffect(() => {
    if (!auctionControl?.current_lot_id) return;

    const channel = supabase
      .channel(`admin-bids-${auctionControl.current_lot_id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'bids', 
        filter: `lot_id=eq.${auctionControl.current_lot_id}` 
      }, async (payload) => {
        const newBid = payload.new as any;
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', newBid.user_id)
          .single();
        
        setRecentBids(prev => [{ ...newBid, profiles: profile }, ...prev].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 20));

        // CRITICAL: Update current lot highest bid in admin panel immediately
        setAuctionControl((prev: any) => {
          if (prev && prev.current_lot && prev.current_lot.id === newBid.lot_id) {
            const bidAmount = Number(newBid.amount);
            const currentHighest = Number(prev.current_lot.current_highest_bid || prev.current_lot.starting_price || 0);
            if (bidAmount > currentHighest) {
              console.log('Admin Panel: Updating current lot highest bid from real-time bid:', bidAmount);
              return {
                ...prev,
                current_lot: {
                  ...prev.current_lot,
                  current_highest_bid: bidAmount
                }
              };
            }
          }
          return prev;
        });

        // Also update the lots list in admin panel
        setLots(prev => prev.map(lot => {
          if (lot.id === newBid.lot_id) {
            const bidAmount = Number(newBid.amount);
            const currentHighest = Number(lot.current_highest_bid || lot.starting_price || 0);
            if (bidAmount > currentHighest) {
              return { ...lot, current_highest_bid: bidAmount };
            }
          }
          return lot;
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [auctionControl?.current_lot_id]);

  const updateAuctionMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedAuctionId) return;
      const { error } = await supabase.from('auctions').update(data).eq('id', selectedAuctionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-active-auctions'] });
      toast.success('Leilão atualizado');
    }
  });

  const controlMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!auctionControl?.id) return;
      const { error } = await supabase.from('live_auction_control').update(data).eq('id', auctionControl.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction-control'] });
      toast.success('Comando enviado');
    }
  });

  const manualBidMutation = useMutation({
    mutationFn: async ({ lotId, name, amount, userId, source = 'manual' }: { lotId: string, name: string, amount: number, userId?: string | null, source?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");
      
      console.log('Inserting bid:', { lotId, amount, userId: userId || userData.user.id, name, source });

      const { error: bidError } = await supabase.from('bids').insert({
        lot_id: lotId,
        amount: amount,
        user_id: userId || userData.user.id,
        manual_bidder_name: name,
        bid_source: source
      });
      
      if (bidError) {
        console.error('Bid insertion error:', bidError);
        throw bidError;
      }

      // Update current highest bid on lot
      const { error: lotError } = await supabase.from('lots').update({ current_highest_bid: amount }).eq('id', lotId);
      if (lotError) {
        console.error('Lot update error:', lotError);
        throw lotError;
      }

      // Auto-restart timer if configured
      if (auctionControl?.auto_restart_timer && auctionControl?.is_running) {
        await supabase.from('live_auction_control').update({ 
          current_lot_started_at: new Date().toISOString()
        }).eq('id', auctionControl.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction-control'] });
      queryClient.invalidateQueries({ queryKey: ['live-lots'] });
      queryClient.invalidateQueries({ queryKey: ['recent-bids'] });
      toast.success('Lance registrado com sucesso');
      setManualBidAmount('');
      // Mantemos o usuário e a fonte selecionados para agilizar o próximo lance se for o mesmo
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      toast.error('Erro ao registrar lance: ' + (error.message || 'Erro desconhecido'));
    }
  });

  const reconcileMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAuctionId) return;
      const { data, error } = await supabase.rpc('reconcile_auction_bids', { p_auction_id: selectedAuctionId });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['live-lots-initial', selectedAuctionId] });
      queryClient.invalidateQueries({ queryKey: ['auction-control-initial', selectedAuctionId] });
      checkSync();
      toast.success(data?.message || 'Lances reconciliados com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao reconciliar lances: ' + error.message);
    }
  });

  useEffect(() => {
    if (activeAuctions && selectedAuctionId) {
      const auction = activeAuctions.find((a: any) => a.id === selectedAuctionId);
      if (auction) setStreamingUrl(auction.streaming_url || '');
    }
   }, [activeAuctions, selectedAuctionId]);
  
  useEffect(() => {
    if (!auctionControl?.is_running || !auctionControl?.current_lot_started_at) {
      setLocalTimeRemaining(0);
      return;
    }
    
    const calculate = () => {
      const startedAt = new Date(auctionControl!.current_lot_started_at!).getTime();
      const limit = (auctionControl.lot_time_limit_seconds || 60) * 1000;
      const now = Date.now();
      const diff = Math.max(0, Math.floor((startedAt + limit - now) / 1000));
      setLocalTimeRemaining(diff);
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [auctionControl?.is_running, auctionControl?.current_lot_started_at, auctionControl?.lot_time_limit_seconds]);

  useEffect(() => {
    if (auctionControl?.lot_time_limit_seconds) {
      const mins = Math.floor(auctionControl.lot_time_limit_seconds / 60);
      const secs = auctionControl.lot_time_limit_seconds % 60;
      setTimerMinutes(mins.toString());
      setTimerSeconds(secs.toString());
    }
  }, [auctionControl?.lot_time_limit_seconds]);

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8 font-sans p-2 md:p-6 bg-slate-50/50 min-h-screen">
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-xl">
           <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="bg-primary/10 p-2 rounded-xl">
               <MonitorPlay className="size-6 text-primary" />
             </div>
             <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black uppercase tracking-tight">Auditório de Controle</h1>
                  <div className="flex items-center bg-red-600 text-white px-2 py-0.5 rounded-sm font-black text-[9px] tracking-tighter animate-pulse shadow-sm">
                    LIVE
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-medium">Controle total da transmissão e lances</p>
             </div>
           </div>

           <div className="flex items-center gap-3 w-full md:w-auto">
             <Select value={selectedAuctionId || ''} onValueChange={setSelectedAuctionId}>
                <SelectTrigger className="w-full md:w-[350px] h-12 bg-slate-50 border-slate-200 font-bold">
                  <SelectValue placeholder="SELECIONE UM LEILÃO ATIVO" />
                </SelectTrigger>
                <SelectContent>
                  {activeAuctions?.map(auction => (
                    <SelectItem key={auction.id} value={auction.id}>{auction.title}</SelectItem>
                  ))}
                </SelectContent>
             </Select>
             {selectedAuctionId && (
               <>
                 <Button 
                   variant="outline" 
                   size="icon" 
                   className="h-12 w-12 rounded-xl" 
                   onClick={() => {
                     queryClient.invalidateQueries({ queryKey: ['auction-control', selectedAuctionId] });
                     queryClient.invalidateQueries({ queryKey: ['live-active-auctions'] });
                   }}
                 >
                   <RefreshCcw className="size-5" />
                 </Button>
                 <Button 
                   variant="outline" 
                   className={cn(
                     "h-12 px-4 rounded-xl gap-2 font-bold",
                     syncStatus === 'out_of_sync' 
                      ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" 
                      : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                   )} 
                   onClick={() => reconcileMutation.mutate()}
                   disabled={reconcileMutation.isPending}
                 >
                   {syncStatus === 'out_of_sync' ? <AlertCircle className="size-4" /> : <Shield className="size-4" />}
                   {reconcileMutation.isPending ? 'AUDITANDO...' : syncStatus === 'out_of_sync' ? 'CORRIGIR DIVERGÊNCIAS' : 'SISTEMA SINCRONIZADO'}
                 </Button>
               </>
             )}
           </div>
        </header>

        {!selectedAuctionId ? (
          <Card className="p-20 flex flex-col items-center justify-center text-center bg-slate-50 border-dashed border-2 border-slate-200 rounded-[2rem]">
            <Gavel className="size-16 text-slate-300 mb-6" />
            <h2 className="text-xl font-black text-slate-900 uppercase">Aguardando Seleção</h2>
            <p className="text-slate-500 max-w-xs mt-2">Escolha um leilão ativo acima para iniciar o controle do auditório virtual.</p>
          </Card>
        ) : (
          <div className="space-y-8">
            
            {/* Top Section: Live Video - Full width on top as requested */}
            <div className="w-full">
              <div className="aspect-video w-full bg-black rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 group relative max-h-[60vh]">
                <LivePlayer 
                  url={streamingUrl} 
                  isStreamingActive={!!activeAuctions?.find(a => a.id === selectedAuctionId)?.streaming_active} 
                />
                <div className="absolute top-6 right-6 z-30">
                  <Badge className={cn(
                    "font-black px-4 py-1 text-[10px] tracking-widest",
                    activeAuctions?.find(a => a.id === selectedAuctionId)?.streaming_active ? "bg-red-600 animate-pulse" : "bg-slate-500"
                  )}>
                    {activeAuctions?.find(a => a.id === selectedAuctionId)?.streaming_active ? 'LIVE CONTROL' : 'STREAM OFFLINE'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick config bar below video */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 rounded-2xl border-slate-200 shadow-sm flex items-center justify-between col-span-1">
                <div className="flex items-center gap-3">
                  <MonitorPlay className="size-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Transmissão</span>
                </div>
                <Switch
                  id="streaming-active"
                  checked={activeAuctions?.find(a => a.id === selectedAuctionId)?.streaming_active || false}
                  onCheckedChange={(val) => updateAuctionMutation.mutate({ streaming_active: val })}
                />
              </Card>
              <Card className={cn("p-4 rounded-2xl shadow-sm flex items-center justify-between col-span-1 border", autoAdvance ? "border-green-200 bg-green-50/50" : "border-slate-200")}>
                <div className="flex items-center gap-3">
                  <SkipForward className={cn("size-4", autoAdvance ? "text-green-600" : "text-slate-400")} />
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", autoAdvance ? "text-green-700" : "text-slate-900")}>Auto Avançar</span>
                </div>
                <Switch checked={autoAdvance} onCheckedChange={setAutoAdvance} />
              </Card>
              
              <Card className="p-2 rounded-2xl border-slate-200 shadow-sm flex items-center gap-2 col-span-1 px-4">
                <Input 
                  placeholder="URL do Vídeo..."
                  className="h-8 bg-slate-50 border-slate-200 text-[10px] font-bold"
                  value={streamingUrl}
                  onChange={(e) => setStreamingUrl(e.target.value)}
                />
                <Button 
                  size="sm"
                  className="bg-slate-900 text-white font-black h-8 px-3 text-[8px] rounded-lg"
                  onClick={() => {
                    let url = streamingUrl;
                    if (url && !url.startsWith('http')) url = 'https://' + url;
                    updateAuctionMutation.mutate({ streaming_url: url });
                  }}
                >
                  OK
                </Button>
              </Card>

              <Card className="p-2 rounded-2xl border-slate-200 shadow-sm flex items-center gap-2 col-span-1 px-4">
                <Input 
                  placeholder="Mensagem do Telão..."
                  className="h-8 bg-slate-50 border-slate-200 text-[10px] font-bold"
                  value={transitionMessage}
                  onChange={(e) => setTransitionMessage(e.target.value)}
                />
                <Button 
                  variant="outline"
                  size="sm"
                  className="text-[8px] font-black uppercase h-8 px-3 rounded-lg border-slate-200"
                  onClick={() => controlMutation.mutate({ transition_message: transitionMessage })}
                >
                  SALVAR
                </Button>
              </Card>
            </div>

            {/* Bottom Section: Two Main Control Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Column 1: Current Lot & Main Commands */}
              <div className="space-y-8">
                {/* Current Lot Card */}
                <Card className="p-6 rounded-[2rem] border-primary/30 bg-primary/5 shadow-xl shadow-primary/5 flex flex-col min-h-[600px]">
                  <div className="space-y-4 h-full flex flex-col">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-primary text-white font-black px-4 py-1 text-[10px]">LOTE EM EXIBIÇÃO</Badge>
                      <div className="flex items-center gap-4 text-primary">
                        <div className="flex items-center gap-1">
                          <Input 
                            type="number" 
                            className="w-12 h-7 text-center font-bold bg-white/50 border-primary/20 p-1 text-xs" 
                            value={timerMinutes}
                            onChange={(e) => setTimerMinutes(e.target.value)}
                          />
                          <span className="font-bold">:</span>
                          <Input 
                            type="number" 
                            className="w-12 h-7 text-center font-bold bg-white/50 border-primary/20 p-1 text-xs" 
                            value={timerSeconds}
                            onChange={(e) => setTimerSeconds(e.target.value)}
                          />
                          <Button 
                            size="sm" 
                            className="h-7 w-7 p-0 rounded-lg bg-primary text-white"
                            onClick={() => {
                              const totalSecs = (parseInt(timerMinutes) * 60) + parseInt(timerSeconds);
                              controlMutation.mutate({ 
                                lot_time_limit_seconds: totalSecs,
                                current_lot_started_at: new Date().toISOString() 
                              });
                            }}
                          >
                            <Save className="size-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="size-4" />
                          <span className="text-xl font-black tabular-nums">
                            {localTimeRemaining}s
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center py-4">
                      {auctionControl?.current_lot ? (
                        <div className="space-y-4">
                          <div className="h-[350px] w-full bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-800 relative">
                            {auctionControl.current_lot.image_url ? (
                              <img src={auctionControl.current_lot.image_url} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600">
                                <Gavel className="size-16 opacity-20" />
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-6">
                              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-1 truncate">
                                #{auctionControl.current_lot.lot_order} - {auctionControl.current_lot.title}
                              </h2>
                              <div className="flex items-baseline gap-4">
                                <span className="text-3xl font-black text-green-400 tabular-nums">
                                  R$ {Number(auctionControl.current_lot.current_highest_bid || auctionControl.current_lot.starting_price).toLocaleString('pt-BR')}
                                </span>
                                <Badge className="bg-white/10 text-white/70 border-none font-bold text-[8px] uppercase tracking-widest px-3 py-0.5">
                                  INC: R$ {Number(auctionControl.current_lot.min_increment || 100).toLocaleString('pt-BR')}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                             <Button 
                               className={cn("h-14 font-black rounded-2xl text-sm", auctionControl?.is_running ? "bg-amber-500 text-white shadow-glow-gold" : "bg-green-600 text-white shadow-glow-green")}
                               onClick={() => controlMutation.mutate({ is_running: !auctionControl?.is_running, current_lot_started_at: !auctionControl?.is_running ? new Date().toISOString() : auctionControl?.current_lot_started_at })}
                             >
                               {auctionControl?.is_running ? <Pause className="mr-2 size-4" /> : <Play className="mr-2 size-4" />}
                               {auctionControl?.is_running ? 'PAUSAR' : 'ABRIR LANCES'}
                             </Button>
                             <Button 
                               variant="destructive" 
                               className="h-14 font-black rounded-2xl text-sm shadow-glow-red"
                               onClick={async () => {
                                 if (!auctionControl?.current_lot) return;
                                 
                                 const lotId = auctionControl.current_lot_id!;
                                 const auctionId = selectedAuctionId!;

                                 // Get the highest bid for this lot
                                 const { data: highestBid } = await supabase
                                   .from('bids')
                                   .select('*')
                                   .eq('lot_id', lotId)
                                   .order('amount', { ascending: false })
                                   .limit(1)
                                   .maybeSingle();

                                 if (highestBid) {
                                   // Create winner record
                                   const bidAmount = Number(highestBid.amount);
                                   const commissionRate = Number(activeAuctions?.find(a => a.id === auctionId)?.commission_rate || 5);
                                   const adminFee = Number(activeAuctions?.find(a => a.id === auctionId)?.administrative_fee || 0);
                                   const commissionAmount = (bidAmount * commissionRate) / 100;
                                   const finalAmount = bidAmount + commissionAmount + adminFee;

                                   const { error: winnerError } = await supabase.from('auction_winners').insert({
                                     lot_id: lotId,
                                     user_id: highestBid.user_id,
                                     bid_amount: bidAmount,
                                     commission_amount: commissionAmount,
                                     administrative_amount: adminFee,
                                     final_amount: finalAmount,
                                     escrow_status: 'pending',
                                     manual_bidder_name: highestBid.manual_bidder_name,
                                     manual_bidder_phone: highestBid.manual_bidder_phone
                                   });

                                   if (winnerError) {
                                     toast.error('Erro ao registrar ganhador: ' + winnerError.message);
                                     return;
                                   }

                                   // Update lot status
                                   await supabase.from('lots').update({ status: 'sold' }).eq('id', lotId);
                                   controlMutation.mutate({ auctioneer_status: 'sold', is_running: false });
                                   toast.success('LOTE ARREMATADO E REGISTRADO!');
                                 } else {
                                   // No bids, mark as unsold
                                   await supabase.from('lots').update({ status: 'unsold' }).eq('id', lotId);
                                   controlMutation.mutate({ auctioneer_status: 'unsold', is_running: false });
                                   toast.info('Lote encerrado sem lances.');
                                 }

                                 // Auto-advance to next lot after 4s
                                 if (autoAdvance) {
                                   const currentOrder = auctionControl?.current_lot?.lot_order || 0;
                                   const nextLot = lots
                                     .filter((l: any) => l.status === 'pending' && (l.lot_order || 0) > currentOrder)
                                     .sort((a: any, b: any) => (a.lot_order || 0) - (b.lot_order || 0))[0];
                                   if (nextLot) {
                                     toast.info(`Próximo lote em 4s: #${nextLot.lot_order} ${nextLot.title}`, { duration: 4000 });
                                     setTimeout(() => {
                                       controlMutation.mutate({
                                         current_lot_id: nextLot.id,
                                         current_lot_started_at: new Date().toISOString(),
                                         auctioneer_status: 'idle',
                                         is_running: true,
                                       });
                                     }, 4000);
                                   }
                                 }
                               }}
                             >
                               <Gavel className="mr-2 size-4" /> ARREMATAR!
                             </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-20 opacity-30">
                          <Gavel className="size-12 mx-auto mb-4" />
                          <p className="font-bold uppercase text-xs">Nenhum lote selecionado</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Auctioneer Commands */}
                <Card className="p-6 rounded-[2rem] border-slate-200 shadow-sm space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button 
                      className="h-16 bg-amber-500 text-white hover:bg-amber-600 font-black text-[10px] rounded-2xl shadow-lg border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 transition-all px-2 uppercase tracking-tighter"
                      onClick={() => controlMutation.mutate({ auctioneer_status: 'dol1' })}
                    >
                      DOU-LHE UMA!
                    </Button>
                    <Button 
                      className="h-16 bg-red-600 text-white hover:bg-red-700 font-black text-[10px] rounded-2xl shadow-lg border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all px-2 uppercase tracking-tighter"
                      onClick={() => controlMutation.mutate({ auctioneer_status: 'dol2' })}
                    >
                      DOU-LHE DUAS!
                    </Button>
                    <Button 
                      className="h-16 bg-blue-600 text-white hover:bg-blue-700 font-black text-[10px] rounded-2xl shadow-lg border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 flex flex-col items-center justify-center p-1"
                      onClick={() => {
                        if (!auctionControl?.current_lot) return;
                        const current = Number(auctionControl.current_lot.current_highest_bid || auctionControl.current_lot.starting_price || 0);
                        const minInc = Number(auctionControl.current_lot.min_increment || 100);
                        manualBidMutation.mutate({
                          lotId: auctionControl.current_lot_id!,
                          name: manualBidName || 'Lance de Segurança',
                          amount: current + minInc,
                          userId: manualBidUserId,
                          source: 'security_bid'
                        });
                      }}
                    >
                      <Shield className="size-4 mb-1" />
                      LANCE SEGURANÇA
                    </Button>
                  </div>
                    
                  <div className="pt-2 space-y-4 bg-slate-100/50 p-4 rounded-2xl border border-slate-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Origem</p>
                        <div className="flex gap-1 flex-wrap">
                          {['Mesa 1', 'Telefone 1', 'Auditório'].map((source) => (
                            <Button
                              key={source}
                              variant={bidSource === source ? 'default' : 'outline'}
                              size="sm"
                              className={cn(
                                "flex-1 h-8 text-[9px] font-bold uppercase transition-all px-1",
                                bidSource === source ? "bg-slate-900 shadow-md" : "bg-white border-slate-200"
                              )}
                              onClick={() => setBidSource(source)}
                            >
                              {source}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Usuário</p>
                        <div className="relative">
                          <Input 
                            placeholder="Buscar..."
                            className="h-8 bg-white border-slate-200 text-[10px] font-bold"
                            value={userSearchTerm}
                            onChange={(e) => {
                              setUserSearchTerm(e.target.value);
                              setManualBidName(e.target.value);
                              setShowUserSelector(true);
                            }}
                            onFocus={() => setShowUserSelector(true)}
                          />
                          {showUserSelector && users && users.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-32 overflow-y-auto">
                              {users.map((u: any) => (
                                <button
                                  key={u.id}
                                  className="w-full p-2 text-left hover:bg-slate-50 flex flex-col border-b border-slate-100 last:border-0"
                                  onClick={() => {
                                    setManualBidUserId(u.id);
                                    setManualBidName(u.full_name);
                                    setUserSearchTerm(u.full_name);
                                    setShowUserSelector(false);
                                  }}
                                >
                                  <span className="text-[10px] font-bold">{u.full_name}</span>
                                  <span className="text-[8px] text-slate-500">{u.email}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {auctionControl?.current_lot && (
                        <div className="flex flex-wrap gap-2">
                          {[100, 500, 1000, 5000, 10000].map(inc => {
                            const current = Number(auctionControl.current_lot.current_highest_bid || auctionControl.current_lot.starting_price || 0);
                            return (
                              <Button
                                key={inc}
                                variant="outline"
                                size="sm"
                                className="h-9 px-3 text-[10px] font-black border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                                onClick={() => setManualBidAmount((current + inc).toString())}
                              >
                                +{inc.toLocaleString('pt-BR')}
                              </Button>
                            );
                          })}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 text-[10px] font-black border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                            onClick={() => {
                              const current = Number(auctionControl.current_lot.current_highest_bid || auctionControl.current_lot.starting_price || 0);
                              const inc = Number(auctionControl.current_lot.min_increment || 100);
                              setManualBidAmount((current + inc).toString());
                            }}
                          >
                            +INC (R$ {Number(auctionControl.current_lot.min_increment || 100).toLocaleString('pt-BR')})
                          </Button>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">R$</span>
                          <Input 
                            type="number"
                            placeholder="0,00"
                            className="h-12 bg-white border-slate-200 pl-8 font-black text-lg text-green-600 shadow-inner rounded-xl"
                            value={manualBidAmount}
                            onChange={(e) => setManualBidAmount(e.target.value)}
                          />
                        </div>
                        <Button 
                          className="h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl px-6 font-black shadow-lg flex-1 text-[11px] uppercase tracking-widest border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all"
                          onClick={() => {
                            if (!auctionControl?.current_lot_id || !manualBidAmount) {
                              toast.error('Informe o valor do lance');
                              return;
                            }
                            manualBidMutation.mutate({
                              lotId: auctionControl.current_lot_id,
                              name: manualBidName || bidSource,
                              amount: parseFloat(manualBidAmount),
                              userId: manualBidUserId,
                              source: bidSource.toLowerCase().replace(' ', '_')
                            });
                          }}
                        >
                          EFETUAR LANCE
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Column 2: History, Queue & Audience */}
              <div className="space-y-8">
                
                <div className="grid grid-cols-2 gap-6">
                  <Card className="p-5 rounded-[2rem] border-slate-200 shadow-sm">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <Users className="size-3 text-primary" /> Público
                    </h3>
                    <div className="space-y-1">
                      <p className="text-2xl font-black text-slate-900 tabular-nums">1.248</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ON-LINE</p>
                    </div>
                  </Card>
                  
                  <Card className="p-5 rounded-[2rem] border-slate-200 shadow-sm">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <Shield className="size-3 text-primary" /> Habilitados
                    </h3>
                    <div className="space-y-1">
                      <p className="text-2xl font-black text-primary tabular-nums">482</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">APROVADOS</p>
                    </div>
                  </Card>
                </div>

                {/* Histórico de Lances */}
                <Card className="p-6 rounded-[2rem] border-slate-200 shadow-sm flex flex-col min-h-[450px]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                      <TrendingUp className="size-4 text-primary" /> Histórico de Lances
                    </h3>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase">{recentBids?.length || 0} Lances</Badge>
                  </div>

                  <div className="space-y-2 overflow-y-auto pr-2 max-h-[350px]">
                    {recentBids && recentBids.length > 0 ? (
                      recentBids.map((bid: any, idx: number) => (
                        <div 
                          key={bid.id} 
                          className={cn(
                            "p-2.5 rounded-xl border flex items-center justify-between animate-in fade-in slide-in-from-right-2 duration-300",
                            idx === 0 ? "bg-green-50 border-green-200 shadow-sm" : "bg-white border-slate-100"
                          )}
                        >
                          <div className="flex flex-col">
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5",
                              idx === 0 ? "text-green-700" : "text-slate-500"
                            )}>
                              {bid.bid_source?.includes('telefone') && <Phone className="size-2.5" />}
                              {bid.bid_source?.includes('mesa') && <Mic className="size-2.5" />}
                              {bid.manual_bidder_name || bid.profiles?.full_name || 'Usuário'} 
                              {idx === 0 && <span className="ml-1 text-[7px] bg-green-500 text-white px-1 py-0.5 rounded-full">LÍDER</span>}
                            </span>
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                              {bid.bid_source || 'Online'}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "text-xs font-black tabular-nums",
                              idx === 0 ? "text-green-600" : "text-slate-900"
                            )}>
                              R$ {Number(bid.amount).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                        <Gavel className="size-8 mb-2" />
                        <p className="text-[10px] font-bold uppercase">Nenhum lance registrado</p>
                      </div>
                    )}
                  </div>

                  {recentBids && recentBids.length > 0 && (
                    <div className="mt-auto pt-4 border-t border-slate-100">
                      <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-xl">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Valor Atual</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase truncate max-w-[150px]">
                            {recentBids[0].manual_bidder_name || recentBids[0].profiles?.full_name || 'Usuário'}
                          </span>
                          <span className="text-xl font-black text-green-400 tabular-nums">
                            R$ {Number(recentBids[0].amount).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Lots List */}
                <Card className="p-6 rounded-[2rem] border-slate-200 shadow-sm">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6">Próximos Lotes</h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {lots?.map(lot => (
                      <div 
                        key={lot.id} 
                        className={cn(
                          "p-3 rounded-2xl border transition-all flex items-center justify-between group",
                          auctionControl?.current_lot_id === lot.id 
                            ? "bg-primary/10 border-primary shadow-sm" 
                            : "bg-slate-50 border-slate-100 hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center font-black text-[10px] text-slate-900">
                            {lot.lot_order}
                          </div>
                          <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{lot.title}</p>
                        </div>
                        
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className={cn(
                            "rounded-xl font-black text-[9px] h-8 px-4 uppercase tracking-widest",
                            auctionControl?.current_lot_id === lot.id ? "text-primary bg-primary/5" : "text-slate-500"
                          )}
                          disabled={auctionControl?.current_lot_id === lot.id}
                          onClick={() => controlMutation.mutate({ current_lot_id: lot.id, auctioneer_status: 'idle', current_lot_started_at: new Date().toISOString(), is_running: true })}
                        >
                          {auctionControl?.current_lot_id === lot.id ? 'EM TELA' : 'EXIBIR'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            {/* Reconciliation Logs Section */}
            <Card className="p-8 rounded-[2rem] border-slate-200 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-900 p-2 rounded-xl text-white">
                    <Shield className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">Histórico de Auditoria e Reconciliação</h3>
                    <p className="text-xs text-slate-500 font-medium italic">Registro detalhado de discrepâncias corrigidas automaticamente</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl font-bold gap-2"
                  onClick={() => {
                    setShowReconciliationLogs(!showReconciliationLogs);
                    if (!showReconciliationLogs) fetchLogs();
                  }}
                >
                  {showReconciliationLogs ? <Pause className="size-4" /> : <RefreshCcw className="size-4" />}
                  {showReconciliationLogs ? 'OCULTAR REGISTROS' : 'VER HISTÓRICO'}
                </Button>
              </div>

              {showReconciliationLogs && (
                <div className="space-y-4">
                  {!reconciliationLogs || reconciliationLogs.length === 0 ? (
                    <div className="py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma discrepância registrada até o momento</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {reconciliationLogs.map((log: any) => (
                        <div key={log.id} className="p-4 rounded-2xl bg-white border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                          <div className="flex items-center gap-4">
                            <div className="size-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center border border-green-100">
                              <CheckCircle2 className="size-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-slate-900 uppercase">Lote: {log.lots?.title}</span>
                                <Badge variant="outline" className="text-[8px] h-4 px-2 uppercase font-black border-slate-200">AUTO-CORRIGIDO</Badge>
                              </div>
                              <p className="text-[10px] text-slate-500">
                                Valor corrigido de <span className="font-bold text-red-500">R$ {Number(log.actual_value || 0).toLocaleString('pt-BR')}</span> para <span className="font-bold text-green-600">R$ {Number(log.expected_value || 0).toLocaleString('pt-BR')}</span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sincronizado em</p>
                            <p className="text-[10px] font-black text-slate-900">
                              {new Date(log.resolved_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
