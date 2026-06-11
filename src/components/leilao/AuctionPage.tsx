import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, formatCurrency } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { LiveAuctionPanel } from '@/components/leilao/LiveAuctionPanel';
import { SimultaneousAuctionGrid } from '@/components/leilao/SimultaneousAuctionGrid';
import { BidRanking } from '@/components/leilao/BidRanking';
import { LivePlayer } from '@/components/leilao/LivePlayer';
import { DepositModal } from '@/components/leilao/DepositModal';
import { ParticipantsList } from '@/components/leilao/ParticipantsList';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Maximize2, MonitorPlay, Trophy, Star, ShieldCheck, AlertTriangle, Gavel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from '@tanstack/react-router';
import { SkeletonPremium } from '@/components/ui/skeleton-premium';
import { BidConfirmDialog } from './BidConfirmDialog';
import { BID_ERRORS } from '@/lib/bid-errors';
import { Auction, Lot, Bid, LiveAuctionControl } from '@/types/auction';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { SEO } from '../SEO';
import { SmartImage } from '../SmartImage';

interface AuctionPageProps {
  auctionId: string;
}

export function AuctionPage({ auctionId }: AuctionPageProps) {
  const { user } = useAuth();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [lots, setLots] = useState<Lot[]>([]);
  const [bids, setBids] = useState<Record<string, Bid[]>>({});
  const [currentLot, setCurrentLot] = useState<Lot | null>(null);
  const [auctionControl, setAuctionControl] = useState<LiveAuctionControl | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [userBids, setUserBids] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [depositStatus, setDepositStatus] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pendingBid, setPendingBid] = useState<{ lotId: string; amount: number; lotTitle?: string; isBuyout?: boolean } | null>(null);
  const [submittingLots, setSubmittingLots] = useState<Set<string>>(new Set());

  // Fetch auction data
  useEffect(() => {
    const fetchAuctionData = async () => {
      try {
        setLoading(true);
        const { data: auctionData, error: auctionError } = await supabase
          .from('auctions')
          .select('*')
          .eq('id', auctionId)
          .single();

        if (auctionError) throw auctionError;
        setAuction(auctionData);

        const { data: lotsData, error: lotsError } = await supabase
          .from('lots')
          .select('*')
          .eq('auction_id', auctionId)
          .order('lot_order', { ascending: true });

        if (lotsError) throw lotsError;
        setLots(lotsData || []);
        setSelectedLot(lotsData?.[0]?.id || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchAuctionData();
  }, [auctionId]);

  // Fetch user deposit status
  useEffect(() => {
    if (!user) return;

    const fetchDepositStatus = async () => {
      const { data, error } = await supabase
        .from('caucao')
        .select('status')
        .eq('user_id', user.id)
        .eq('auction_id', auctionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setDepositStatus(data.status);
      }
    };

    fetchDepositStatus();

    // Subscribe to deposit status changes
    const channel = supabase
      .channel(`user-deposit:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'caucao',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setDepositStatus((payload.new as any).status);
            if ((payload.new as any).status === 'approved') {
              toast.success('Sua caução foi aprovada! Você já pode dar lances.');
            } else if ((payload.new as any).status === 'rejected') {
              toast.error('Sua caução foi rejeitada. Verifique seus documentos.');
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  // Fetch user role
  useEffect(() => {
    if (!user) return;

    const fetchUserRole = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setIsAdmin(data.role === 'admin');
      }
    };

    fetchUserRole();
  }, [user]);

  // Fetch initial bids for the selected lot
  useEffect(() => {
    if (!selectedLot) return;
    
    const fetchInitialBids = async (lotId: string) => {
      console.log('Fetching initial bids for lot:', lotId);
      try {
        const { data, error } = await supabase
          .from('bids')
          .select('*, profiles:profiles_public(full_name, avatar_url)')
          .eq('lot_id', lotId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching bids:', error);
          return;
        }

        if (data) {
          console.log('Bids fetched:', data.length);
          setBids(prev => ({
            ...prev,
            [lotId]: (data as any[]).reverse() as Bid[],
          }));
        }
      } catch (err) {
        console.error('Exception fetching bids:', err);
      }
    };

    fetchInitialBids(selectedLot);
  }, [selectedLot]);

  // Fetch Live Control data
  useEffect(() => {
    if (!auctionId || auction?.type !== 'live') return;

    const fetchLiveControl = async () => {
      const { data, error } = await supabase
        .from('live_auction_control')
        .select('*')
        .eq('auction_id', auctionId)
        .maybeSingle();

      if (!error && data) {
        setAuctionControl(data as any);
        setIsRunning(data.is_running ?? false);
        
        if (data.current_lot_id) {
          setSelectedLot(data.current_lot_id);
          setLots(currentLots => {
            const lot = currentLots.find(l => l.id === data.current_lot_id);
            if (lot) setCurrentLot(lot);
            return currentLots;
          });
        }
      }
    };

    fetchLiveControl();

    const channel = supabase
      .channel(`auction-control:${auctionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_auction_control',
          filter: `auction_id=eq.${auctionId}`,
        },
        async (payload) => {
          const control = payload.new as any;
          setAuctionControl(control);
          setIsRunning(control.is_running ?? false);

          if (control.current_lot_id) {
            setSelectedLot(control.current_lot_id);
            const { data: lotData } = await supabase.from('lots').select('*').eq('id', control.current_lot_id).single();
            if (lotData) {
              setCurrentLot(lotData);
              setLots(currentLots => currentLots.map(l => l.id === lotData.id ? lotData : l));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [auctionId, auction?.type]);

  // Subscribe to real-time updates for bids, lots, and auctions
  useEffect(() => {
    if (!auctionId) return;

    const channel = supabase
      .channel(`auction-realtime:${auctionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
        },
        (payload) => {
          const newBid = payload.new as Bid;
          
          setBids(prev => {
            const lotId = newBid.lot_id;
            const currentBids = prev[lotId] || [];
            if (currentBids.some(b => b.id === newBid.id)) return prev;
            return {
              ...prev,
              [lotId]: [...currentBids, newBid as any],
            };
          });

          supabase
            .from('profiles_public')
            .select('full_name, avatar_url')
            .eq('id', newBid.user_id)
            .single()
            .then(({ data: profile }) => {
              if (profile) {
                setBids(prev => {
                  const lotId = newBid.lot_id;
                  const currentBids = prev[lotId] || [];
                  return {
                    ...prev,
                    [lotId]: currentBids.map(b => 
                      b.id === newBid.id ? { ...b, profiles: profile } : b
                    ),
                  };
                });
              }
            });

          setCurrentLot(prev => {
            if (prev && prev.id === newBid.lot_id) {
              const bidAmount = Number(newBid.amount);
              const currentHighest = Number(prev.current_highest_bid || prev.starting_price || 0);
              if (bidAmount > currentHighest) {
                return { ...prev, current_highest_bid: bidAmount };
              }
            }
            return prev;
          });
          
          setLots(prev => {
            return prev.map(lot => {
              if (lot.id === newBid.lot_id) {
                const bidAmount = Number(newBid.amount);
                const currentHighest = Number(lot.current_highest_bid || lot.starting_price || 0);
                if (bidAmount > currentHighest) {
                  return { ...lot, current_highest_bid: bidAmount };
                }
              }
              return lot;
            });
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lots',
          filter: `auction_id=eq.${auctionId}`,
        },
        (payload) => {
          const updatedLot = payload.new as Lot;
          setLots(prev => prev.map(lot => (lot.id === updatedLot.id ? updatedLot : lot)));
          setCurrentLot(prev => (prev?.id === updatedLot.id ? updatedLot : prev));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'auctions',
          filter: `id=eq.${auctionId}`,
        },
        (payload) => {
          const updatedAuction = payload.new as Auction;
          setAuction(updatedAuction);
        }
      )
      .subscribe();

    const handleReconnection = async () => {
      const { data: controlData } = await supabase.from('live_auction_control').select('*').eq('auction_id', auctionId).maybeSingle();
      if (controlData) {
        setAuctionControl(controlData as any);
        if (controlData.current_lot_id) setSelectedLot(controlData.current_lot_id);
      }
      
      const { data: auctionData } = await supabase.from('auctions').select('*').eq('id', auctionId).single();
      if (auctionData) setAuction(auctionData);
      
      const { data: lotsData } = await supabase.from('lots').select('*').eq('auction_id', auctionId).order('lot_order', { ascending: true });
      if (lotsData) setLots(lotsData);
    };

    window.addEventListener('focus', handleReconnection);
    window.addEventListener('online', handleReconnection);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', handleReconnection);
      window.removeEventListener('online', handleReconnection);
    };
  }, [auctionId]);

  // Timer synchronized with the control panel
  useEffect(() => {
    if (!isRunning || !auctionControl?.current_lot_started_at || auction?.type !== 'live') {
      setTimeRemaining(0);
      return;
    }

    const calculate = () => {
      const startedAt = new Date(auctionControl.current_lot_started_at!).getTime();
      const limit = (auctionControl.lot_time_limit_seconds || 60) * 1000;
      const now = Date.now();
      const diff = Math.max(0, Math.floor((startedAt + limit - now) / 1000));
      setTimeRemaining(diff);
    };

    calculate();
    const interval = setInterval(calculate, 1000);

    return () => clearInterval(interval);
  }, [isRunning, auctionControl?.current_lot_started_at, auctionControl?.lot_time_limit_seconds, auction?.type]);

  const handleOpenLot = useCallback(
    async (lotId: string) => {
      const lot = lots.find(l => l.id === lotId);
      if (!lot) return;

      setCurrentLot(lot);
      setTimeRemaining(300);
      setIsRunning(false);
      setSelectedLot(lotId);

      // Update live control in DB
      if (auction?.type === 'live') {
        await supabase
          .from('live_auction_control')
          .update({
            current_lot_id: lotId,
            current_lot_started_at: new Date().toISOString(),
          })
          .eq('auction_id', auctionId);
      }
    },
    [auction, auctionId, lots]
  );

  const handleCloseLot = useCallback(async (lotId?: string) => {
    const lotToClose = lotId ? lots.find(l => l.id === lotId) : currentLot;
    if (!lotToClose) return;

    // Get highest bid
    const { data: bidsData } = await supabase
      .from('bids')
      .select('*')
      .eq('lot_id', lotToClose.id)
      .order('amount', { ascending: false })
      .limit(1);

    if (bidsData && bidsData.length > 0) {
      const highestBid = bidsData[0];
      const bidAmount = highestBid.amount;
      
      // Calculate amounts based on auction settings
      const commissionRate = auction?.commission_rate || 5.00;
      const adminFee = auction?.administrative_fee || 0.00;
      
      const commissionAmount = (bidAmount * commissionRate) / 100;
      const administrativeAmount = adminFee;
      const finalAmount = bidAmount + commissionAmount + administrativeAmount;

      // Create winner record with breakdown
        const { data: winnerData, error: winnerError } = await supabase.from('auction_winners').insert({
          lot_id: lotToClose.id,
          user_id: highestBid.user_id,
          manual_bidder_name: highestBid.manual_bidder_name,
          bid_amount: bidAmount,
          commission_amount: commissionAmount,
          administrative_amount: administrativeAmount,
          final_amount: finalAmount,
          escrow_status: 'pending'
        }).select('id').single();

      if (!winnerError && winnerData) {
        // Create contract record
        await supabase.from('contracts').insert({
          winner_id: winnerData.id,
          status: 'active'
        });
      }

      // Update lot status
      await supabase
        .from('lots')
        .update({ status: 'sold' })
        .eq('id', lotToClose.id);
      
      toast.success(`Lote ${lotToClose.lot_order || ''} arrematado com sucesso!`);
    } else {
      // No bids - mark as unsold
      await supabase
        .from('lots')
        .update({ status: 'unsold' })
        .eq('id', lotToClose.id);
      
      toast.info(`Lote ${lotToClose.lot_order || ''} encerrado sem lances.`);
    }

    if (!lotId) setIsRunning(false);
  }, [currentLot, lots, auction]);

  const executeBid = useCallback(
    async (lotId: string, amount: number, source: 'web' | 'phone' | 'automatic' = 'web', manualName?: string) => {
      if (!user) {
        toast.error(BID_ERRORS.NOT_LOGGED_IN);
        return;
      }

      if (submittingLots.has(lotId)) return;

      // Lock the lot
      setSubmittingLots(prev => new Set(prev).add(lotId));

      try {
        // RACE CONDITION BLOCK: Fetch the very latest lot data before inserting
        const { data: latestLot, error: lotFetchError } = await supabase
          .from('lots')
          .select('current_highest_bid, starting_price, min_increment')
          .eq('id', lotId)
          .single();

        if (lotFetchError) throw lotFetchError;

        const currentPrice = Number(latestLot.current_highest_bid || latestLot.starting_price || 0);
        const minIncrement = Number(latestLot.min_increment || 100);

        if (amount < currentPrice + minIncrement) {
          toast.error(BID_ERRORS.RACE_CONDITION);
          // Update local state to reflect reality
          setLots(prev => prev.map(l => l.id === lotId ? { ...l, current_highest_bid: currentPrice } : l));
          return;
        }

        // Optimistic Update: Update UI immediately
        const tempBidId = crypto.randomUUID();
        const optimisticBid: Bid = {
          id: tempBidId,
          lot_id: lotId,
          user_id: user.id,
          amount,
          is_automatic: source === 'automatic',
          created_at: new Date().toISOString(),
          bid_source: source,
          manual_bidder_name: manualName,
          profiles: {
            full_name: (user as any).user_metadata?.full_name || 'Você',
            avatar_url: (user as any).user_metadata?.avatar_url || null
          }
        };

        setBids(prev => {
          const currentBids = prev[lotId] || [];
          if (currentBids.some(b => b.amount >= amount)) return prev;
          return {
            ...prev,
            [lotId]: [...currentBids, optimisticBid],
          };
        });

        setCurrentLot(prev => {
          if (prev && prev.id === lotId && amount > Number(prev.current_highest_bid || prev.starting_price || 0)) {
            return { ...prev, current_highest_bid: amount };
          }
          return prev;
        });

        setLots(prev => prev.map(l => 
          l.id === lotId && amount > Number(l.current_highest_bid || l.starting_price || 0) 
            ? { ...l, current_highest_bid: amount } 
            : l
        ));

        const { error } = await supabase.from('bids').insert({
          lot_id: lotId,
          user_id: user.id,
          amount,
          bid_source: source,
          manual_bidder_name: manualName
        });

        if (error) {
          // Rollback on error
          setBids(prev => {
            const currentBids = prev[lotId] || [];
            return {
              ...prev,
              [lotId]: currentBids.filter(b => b.id !== tempBidId),
            };
          });
          toast.error(error.message || BID_ERRORS.PROCESS_ERROR);
          return;
        }

        setUserBids(prev => ({
          ...prev,
          [lotId]: amount,
        }));

        playNotificationSound();
        toast.success('LANCE CONFIRMADO!', {
          description: 'Seu lance foi processado e validado instantaneamente.',
        });
      } catch (err: any) {
        toast.error(err.message || BID_ERRORS.GENERIC_ERROR);
      } finally {
        setSubmittingLots(prev => {
          const next = new Set(prev);
          next.delete(lotId);
          return next;
        });
        setPendingBid(null);
      }
    },
    [user, submittingLots]
  );

  const handlePlaceBid = useCallback(
    async (lotId: string, amount: number) => {
      if (!user) {
        toast.error(BID_ERRORS.NOT_LOGGED_IN);
        return;
      }

      const lot = lots.find(l => l.id === lotId);
      if (!lot) return;

      const currentPrice = Number(lot.current_highest_bid || lot.starting_price || 0);
      const minIncrement = Number(lot.min_increment || 100);

      if (amount < currentPrice + minIncrement) {
        toast.error(BID_ERRORS.LOW_BID(formatCurrency(currentPrice + minIncrement)));
        return;
      }

      if (auction?.starts_at && new Date(auction.starts_at) > new Date()) {
        toast.error(BID_ERRORS.AUCTION_NOT_STARTED);
        return;
      }

      if (auction?.ends_at && new Date(auction.ends_at) < new Date()) {
        toast.error(BID_ERRORS.AUCTION_CLOSED);
        return;
      }

      // Check if auction requires deposit
      const needsDeposit = auction?.require_deposit === true;
      
      // Admins and users with approved deposit can bid, or if deposit is not required
      if (!isAdmin && needsDeposit && depositStatus !== 'approved') {
        setIsDepositModalOpen(true);
        toast.info(BID_ERRORS.DEPOSIT_REQUIRED);
        return;
      }

      // Show confirmation modal
      setPendingBid({ lotId, amount, lotTitle: lot.title });
    },
    [user, isAdmin, depositStatus, auction, lots]
  );

  const handleManualBid = useCallback(
    async (name: string, amount: number) => {
      if (!isAdmin) return;
      
      const lot = lots.find(l => l.id === selectedLot);
      if (!lot) return;

      const currentPrice = Number(lot.current_highest_bid || lot.starting_price || 0);
      const minIncrement = Number(lot.min_increment || 100);

      if (amount < currentPrice + minIncrement) {
        toast.error(BID_ERRORS.LOW_BID(formatCurrency(currentPrice + minIncrement)));
        return;
      }

      await executeBid(selectedLot!, amount, 'phone', name);
    },
    [isAdmin, selectedLot, executeBid, lots]
  );

  // Added this check - need to make sure executeBid is called with 'web' by default or explicitly
  // Since I added 'web' as default value in executeBid definition, it's fine.


  const handleSecurityBid = useCallback(async () => {
    if (!currentLot) return;
    const increment = currentLot.min_increment || 100;
    const newAmount = (currentLot.current_highest_bid || currentLot.starting_price) + increment;
    await executeBid(currentLot.id, newAmount, 'phone');
  }, [currentLot, executeBid]);

  const handleBuyout = useCallback(async (lotId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para arrematar este lote');
      return;
    }

    const lot = lots.find(l => l.id === lotId);
    if (!lot || !lot.buyout_price) return;

    setPendingBid({ 
      lotId, 
      amount: Number(lot.buyout_price), 
      lotTitle: lot.title, 
      isBuyout: true 
    });
  }, [lots]);

  const executeBuyout = useCallback(async (lotId: string) => {
    const lot = lots.find(l => l.id === lotId);
    if (!lot || !lot.buyout_price || !user) return;

    try {
      const buyoutAmt = Number(lot.buyout_price);
      const commissionRate = auction?.commission_rate || 5.00;
      const adminFee = Number(auction?.administrative_fee || 0);
      const commAmt = (buyoutAmt * commissionRate) / 100;
      const totalAmt = buyoutAmt + commAmt + adminFee;

      // 1. Insert winning record
      const { data: winnerData, error: winnerError } = await supabase.from('auction_winners').insert({
        lot_id: lotId,
        user_id: user.id,
        bid_amount: buyoutAmt,
        commission_amount: commAmt,
        administrative_amount: adminFee,
        final_amount: totalAmt,
        escrow_status: 'pending'
      }).select('id').single();

      if (!winnerError && winnerData) {
        // Create contract record
        await supabase.from('contracts').insert({
          winner_id: winnerData.id,
          status: 'active'
        });
      }

      if (winnerError) throw winnerError;

      // 2. Mark lot as sold
      const { error: lotError } = await supabase.from('lots').update({ status: 'sold' }).eq('id', lotId);
      if (lotError) throw lotError;

      // 3. Add to chat for transparency
      await supabase.from('chat_messages').insert({
        auction_id: auctionId,
        user_id: user.id,
        message: `⚠️ LOTE ARREMATADO ANTECIPADAMENTE! O Lote ${lot.lot_order || ''} foi arrematado por R$ ${buyoutAmt.toLocaleString('pt-BR')}.`
      });

      toast.success('PARABÉNS! Você arrematou o lote com sucesso!');
      
      // If it was the current live lot, stop running
      if (currentLot?.id === lotId) {
        setIsRunning(false);
      }
    } catch (err: any) {
      toast.error('Erro ao processar arremate antecipado: ' + err.message);
    }
  }, [user, auction, lots, currentLot]);

  const handleToggleHammer = useCallback(async (lotId: string, enabled: boolean) => {
    if (!isAdmin) return;
    
    try {
      const { error } = await supabase
        .from('lots')
        .update({ hammer_enabled: enabled })
        .eq('id', lotId);
        
      if (error) throw error;
      
      toast.success(enabled ? 'Opção Bater Martelo habilitada!' : 'Opção Bater Martelo desabilitada.');
    } catch (err: any) {
      toast.error('Erro ao alternar martelo: ' + err.message);
    }
  }, [isAdmin]);

  const handleUserHammer = useCallback(async (lotId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase.rpc('hammer_lot', { p_lot_id: lotId });
      if (error) throw error;
      toast.success('PARABÉNS! Martelo batido com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao bater o martelo: ' + (err.message || err.details));
    }
  }, [user]);

  const playNotificationSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const handleUpdateAuction = useCallback(async (data: Partial<Auction>) => {
    if (!isAdmin) return;
    
    try {
      const { error } = await supabase
        .from('auctions')
        .update(data)
        .eq('id', auctionId);
        
      if (error) throw error;
      toast.success('Configurações da transmissão atualizadas!');
    } catch (err: any) {
      toast.error('Erro ao atualizar transmissão: ' + err.message);
    }
  }, [isAdmin, auctionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-950 p-6 pt-24">
        <div className="max-w-[1600px] mx-auto space-y-8">
          <SkeletonPremium className="h-16 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 xl:col-span-9 space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <SkeletonPremium className="aspect-video w-full" />
                <SkeletonPremium className="h-[450px] w-full" />
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <SkeletonPremium key={i} className="h-10 w-24" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-4 xl:col-span-3 space-y-4">
              <SkeletonPremium className="h-[500px] w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error || 'Leilão não encontrado'}</p>
      </div>
    );
  }


  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="min-h-screen transition-all duration-500 bg-brand-950 p-0">
      <SEO 
        title={auction?.title} 
        description={auction?.description || undefined} 
        image={auction?.image_url || undefined}
        type="auction"
        auctionData={auction ? {
          startDate: auction.starts_at,
          endDate: auction.ends_at || undefined,
          location: auction.location || undefined,
          status: auction.status,
          price: lots.length > 0 ? Math.min(...lots.map(l => Number(l.current_highest_bid || l.starting_price || 0))) : undefined
        } : undefined}
        breadcrumbs={[
          { name: 'Início', item: '/' },
          { name: 'Leilões', item: '/' },
          { name: auction?.title || 'Leilão', item: `/leilao/${auctionId}` }
        ]}
      />
      {/* Premium Auction Header/Banner */}
      {auction && (
        <div className={cn(
          "relative w-full overflow-hidden flex flex-col justify-end",
          auction.type === 'live' ? "min-h-[200px] md:h-[300px]" : "min-h-[400px] md:h-[550px]"
        )}>
          {/* Background Image with Blur/Gradient Overlay */}
          <div className="absolute inset-0 z-0">
            <SmartImage 
              src={auction.image_url || "/placeholder.svg"}
              alt={auction.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/40 to-transparent z-10" />
            <div className="absolute inset-0 bg-black/40 z-10" />
          </div>

          {/* Banner Content */}
          <div className={cn(
            "relative z-20 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pb-8 sm:pb-12",
            auction.type === 'live' ? "pt-16 sm:pt-20 lg:pt-24" : "pt-32 sm:pt-40 lg:pt-48"
          )}>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-6 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  {auction.ends_at && new Date(auction.ends_at) < new Date() ? (
                    <Badge className="bg-slate-700 text-white border-none text-[8px] sm:text-[10px] font-black px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-lg shadow-black/20 flex items-center gap-1.5">
                      <div className="size-1.5 rounded-full bg-slate-400" /> EVENTO FINALIZADO
                    </Badge>
                  ) : auction.starts_at && new Date(auction.starts_at) > new Date() ? (
                    <Badge className="bg-blue-600 text-white border-none text-[8px] sm:text-[10px] font-black px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-lg shadow-blue-500/20">
                      EM BREVE • INICIA {format(new Date(auction.starts_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </Badge>
                  ) : auction.type === 'live' && (
                    <Badge className="bg-red-600 text-white border-none animate-pulse text-[8px] sm:text-[10px] font-black px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-lg shadow-red-500/20 flex items-center gap-1.5">
                      <div className="flex items-center bg-white text-red-600 px-1 py-0.5 rounded-sm text-[8px] font-black leading-none">LIVE</div>
                      AO VIVO AGORA
                    </Badge>
                  )}
                  {auction.require_deposit && (
                    <Badge className="bg-brand-500 text-white border-none text-[8px] sm:text-[10px] font-black flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-lg shadow-brand-500/20">
                      <ShieldCheck className="size-3 sm:size-3.5" /> EXIGE CAUÇÃO PARA DAR LANCES
                    </Badge>
                  )}
                  <span className="text-brand-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] bg-brand-900/60 backdrop-blur-md px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-brand-800/50">
                    SINCRO OK
                  </span>
                </div>
                
                <div className="space-y-4">
                  <h1 className={cn(
                    "display-title text-white leading-[0.9] tracking-tighter break-words",
                    auction.type === 'live' ? "text-4xl sm:text-6xl md:text-7xl lg:text-8xl" : "text-5xl sm:text-7xl md:text-8xl lg:text-9xl"
                  )}>
                    {auction.title}
                  </h1>
                  <p className={cn(
                    "text-brand-200 font-medium border-l-4 border-brand-500 pl-4 sm:pl-6 py-2 bg-brand-500/5 backdrop-blur-sm rounded-r-xl",
                    auction.type === 'live' ? "text-xs md:text-sm max-w-xl line-clamp-2" : "text-sm md:text-xl max-w-2xl line-clamp-3"
                  )}>
                    {auction.description || "Participe deste evento exclusivo e arremate os melhores lotes do mercado."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl">
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="size-14 rounded-xl"
                  onClick={toggleFullscreen}
                  title="Modo TV"
                >
                  <Maximize2 className="size-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto space-y-4 px-4 lg:px-12 py-8">
        {/* Auction Finished Banner */}
        {auction.ends_at && new Date(auction.ends_at) < new Date() && (
          <div className="flex flex-col items-center justify-center p-12 rounded-[3rem] bg-brand-900/50 border-2 border-brand-800 mb-8 text-center space-y-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
            <div className="size-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center shadow-2xl mb-2">
              <Gavel className="size-10 text-slate-400" />
            </div>
            <div className="space-y-2 relative z-10">
              <h2 className="text-4xl md:text-5xl section-title text-white">Leilão Finalizado</h2>
              <p className="text-brand-400 text-lg font-medium italic">Este evento foi encerrado em {format(new Date(auction.ends_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.</p>
            </div>
            <div className="flex gap-4 relative z-10">
              <Button variant="outline" className="rounded-full px-8 h-12 border-white/10 text-white" asChild>
                <Link to="/">Voltar para Início</Link>
              </Button>
              <Button className="rounded-full px-8 h-12 bg-white text-black hover:bg-white/90" asChild>
                <Link to="/#results">Ver Resultados</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Status Bar for users who need deposit */}
        {!isAdmin && depositStatus && depositStatus !== 'approved' && auction?.require_deposit && (!auction.ends_at || new Date(auction.ends_at) > new Date()) && (
          <div 
            className="flex items-center justify-between p-4 rounded-2xl bg-yellow-500/10 border-2 border-yellow-500/20 mb-6 cursor-pointer hover:bg-yellow-500/20 transition-all"
            onClick={() => setIsDepositModalOpen(true)}
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="size-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-black text-white uppercase tracking-tight">Habilitação Necessária</p>
                <p className="text-xs text-brand-400 font-medium italic">Sua caução está {depositStatus === 'pending' ? 'em análise' : 'não ativa'}. Clique para regularizar e poder dar lances.</p>
              </div>
            </div>
            <Button size="sm" className="bg-yellow-500 text-black hover:bg-yellow-600 font-black uppercase text-[10px] rounded-lg">Regularizar Agora</Button>
          </div>
        )}

        <Tabs defaultValue="catalog" className="w-full">
          <TabsList className="flex w-full max-w-md mx-auto mb-8 bg-brand-900/50 p-1 rounded-2xl border border-brand-800">
            {auction.type === 'live' && (
              <TabsTrigger 
                value="live" 
                className="flex-1 rounded-xl data-[state=active]:bg-brand-800 data-[state=active]:text-gold text-xs font-black uppercase tracking-widest py-3"
              >
                <MonitorPlay className="size-4 mr-2" />
                Auditório
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="catalog" 
              className="flex-1 rounded-xl data-[state=active]:bg-brand-800 data-[state=active]:text-gold text-xs font-black uppercase tracking-widest py-3"
            >
              <Gavel className="size-4 mr-2" />
              Catálogo de Lotes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="mt-0 focus-visible:ring-0">
            {auction.type === 'live' && (
              <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
                <div className="space-y-4 2xl:col-span-9">
                  <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
                    <LivePlayer 
                      url={auction.streaming_url || undefined} 
                      isStreamingActive={auction.streaming_active ?? false}
                      isPlaying={auction.streaming_playing ?? true}
                    />
                    
                    <LiveAuctionPanel
                      auction={auction}
                      lots={lots}
                      currentLot={currentLot || undefined}
                      isRunning={isRunning}
                      timeRemaining={timeRemaining}
                      onOpenLot={handleOpenLot}
                      onCloseLot={handleCloseLot}
                      onNextLot={() => {
                        const nextIndex = lots.findIndex(l => l.id === currentLot?.id) + 1;
                        if (nextIndex < lots.length) {
                          handleOpenLot(lots[nextIndex].id);
                        }
                      }}
                      onToggleRunning={setIsRunning}
                      onSecurityBid={handleSecurityBid}
                      onPlaceBid={handlePlaceBid}
                      onBuyout={handleBuyout}
                      onToggleHammer={handleToggleHammer}
                      onUserHammer={handleUserHammer}
                      onUpdateAuction={handleUpdateAuction}
                      onManualBid={handleManualBid}
                      depositStatus={depositStatus}
                      isAdmin={isAdmin}
                      isModerator={false}
                      bidCount={selectedLot ? bids[selectedLot]?.length || 0 : 0}
                      currentLeaderId={
                        selectedLot && bids[selectedLot]?.length > 0
                          ? [...bids[selectedLot]].sort((a, b) => b.amount - a.amount)[0].user_id === user?.id
                            ? 'YOU'
                            : [...bids[selectedLot]].sort((a, b) => b.amount - a.amount)[0].user_id
                          : null
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-6 h-full 2xl:col-span-3">
                  <Tabs defaultValue="ranking" className="flex-1 flex flex-col min-h-[500px]">
                    <TabsList className="grid w-full grid-cols-2 bg-brand-900/50 rounded-xl p-1 border border-brand-800">
                      <TabsTrigger value="ranking" className="rounded-lg data-[state=active]:bg-brand-800 text-[10px] font-black uppercase">Ranking</TabsTrigger>
                      <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-brand-800 text-[10px] font-black uppercase">Online</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="ranking" className="flex-1 mt-4 data-[state=inactive]:hidden h-full min-h-[400px]">
                      {selectedLot && (
                        <BidRanking
                          lot={currentLot}
                          bids={(selectedLot ? bids[selectedLot] : []) || []}
                          currentUserId={user?.id}
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="users" className="flex-1 mt-4 data-[state=inactive]:hidden h-full min-h-[400px]">
                      <ParticipantsList auctionId={auctionId} />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="catalog" className="mt-0 focus-visible:ring-0">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl section-title text-white tracking-tighter">Todos os Lotes</h2>
                <Badge variant="outline" className="text-brand-400 border-brand-800 font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                  {lots.length} Lotes Disponíveis
                </Badge>
              </div>
              <SimultaneousAuctionGrid
                auction={auction}
                lots={lots}
                onPlaceBid={handlePlaceBid}
                onCloseLot={handleCloseLot}
                onBuyout={handleBuyout}
                onToggleHammer={handleToggleHammer}
                onUserHammer={handleUserHammer}
                userBids={userBids}
                isLoading={loading}
                depositStatus={depositStatus}
                isAdmin={isAdmin}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <DepositModal 
        isOpen={isDepositModalOpen} 
        onClose={() => setIsDepositModalOpen(false)} 
        requiredAmount={auction?.deposit_amount || 100}
        auctionId={auctionId}
      />

      <BidConfirmDialog
        isOpen={!!pendingBid}
        onClose={() => setPendingBid(null)}
        onConfirm={() => {
          if (pendingBid) {
            if (pendingBid.isBuyout) {
              executeBuyout(pendingBid.lotId);
            } else {
              executeBid(pendingBid.lotId, pendingBid.amount);
            }
          }
        }}
        amount={pendingBid?.amount || 0}
        lotTitle={pendingBid?.lotTitle}
        title={pendingBid?.isBuyout ? "Confirmar Arremate" : "Confirmar Lance"}
        description={pendingBid?.isBuyout ? `Deseja realmente arrematar este lote agora pelo valor de ${formatCurrency(pendingBid.amount)}?` : undefined}
      />
    </div>
  );
}


