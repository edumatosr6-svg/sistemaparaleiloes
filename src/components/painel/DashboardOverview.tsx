import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { SkeletonPremium } from "@/components/ui/skeleton-premium";
import { 
  Wallet, 
  Gavel, 
  Trophy, 
  Bell,
  ArrowUpRight,
  TrendingUp,
  Clock,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AIRecommendations } from "@/components/leilao/AIRecommendations";
import { OnlineSupport } from "@/components/leilao/OnlineSupport";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function DashboardOverview() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<{
    activeBids: number;
    wonLots: number;
    notifications: number;
    recentActivities: any[];
    pendingCaucao: number;
  }>({
    activeBids: 0,
    wonLots: 0,
    notifications: 0,
    recentActivities: [],
    pendingCaucao: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      
      try {
        setLoading(true);
        // Fetch profile for balance
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*, profiles_private(*)')
          .eq('id', user.id)
          .single();
        
        const flattenedProfile = profileData ? {
          ...profileData,
          ...(profileData as any).profiles_private
        } : null;
        setProfile(flattenedProfile);

        // Fetch active bids (unique lots where user has a bid)
        const { count: activeBidsCount } = await supabase
          .from('bids')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        // Fetch won lots
        const { count: wonLotsCount } = await supabase
          .from('auction_winners')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Fetch notifications
        const { count: notificationsCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);

        // Fetch recent activities (last 3 bids)
        const { data: recentBids } = await supabase
          .from('bids')
          .select('*, lots(title)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        const { count: pendingCaucaoCount } = await supabase
          .from('caucao')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'pending');

        setStats({
          activeBids: activeBidsCount || 0,
          wonLots: wonLotsCount || 0,
          notifications: notificationsCount || 0,
          recentActivities: recentBids || [],
          pendingCaucao: pendingCaucaoCount || 0
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-3xl" />)}
        </div>
      </div>
    );
  }

  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl dashboard-title text-white">
          Bem-vindo, {profile?.full_name || user?.email?.split('@')[0] || 'Usuário'}
        </h1>
        <div className="text-sm text-gray-400 font-medium italic">
          Dashboard em tempo real
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-premium bg-gold text-black rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-black/60">Saldo Caução</CardTitle>
            <Wallet className="w-4 h-4 text-black/60" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tabular-nums tracking-tighter">
              R$ {(profile?.caucao_balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className={cn(
              "text-[10px] font-black uppercase tracking-widest flex items-center mt-2",
              stats.pendingCaucao > 0 ? "text-red-900 animate-pulse" : "text-black/80"
            )}>
              {stats.pendingCaucao > 0 ? (
                <>
                  <Clock className="w-3 h-3 mr-1" />
                  {stats.pendingCaucao} Em Análise
                </>
              ) : (
                <>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Liberado para lances
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border-brand-800 bg-brand-900 shadow-xl rounded-3xl border-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-gray-500">Lances Ativos</CardTitle>
            <Gavel className="w-4 h-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white tabular-nums tracking-tighter">{stats.activeBids}</div>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-500 mt-1">
              {stats.activeBids > 0 ? 'Em disputa direta' : 'Nenhum lance ativo'}
            </p>
          </CardContent>
        </Card>

        <Link to="/painel/arrematados">
          <Card className="border-brand-800 bg-brand-900 shadow-xl rounded-3xl border-2 hover:border-gold transition-all cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gold transition-colors">Meus Arremates</CardTitle>
              <Trophy className="w-4 h-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white tabular-nums tracking-tighter">{stats.wonLots}</div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-500 mt-1">
                Total arrematado
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/painel/notificacoes">
          <Card className="border-brand-800 bg-brand-900 shadow-xl rounded-3xl border-2 hover:border-gold transition-all cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gold transition-colors">Notificações</CardTitle>
              <Bell className="w-4 h-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white tabular-nums tracking-tighter">{stats.notifications}</div>
              <p className={cn("text-[10px] font-black uppercase tracking-widest mt-1", stats.notifications > 0 ? "text-blue-500" : "text-brand-500")}>
                {stats.notifications} novas mensagens
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg dashboard-title text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold" />
            Atividades Recentes
          </h2>
          <div className="bg-brand-900 rounded-[2.5rem] border-2 border-brand-800 divide-y divide-brand-800 overflow-hidden shadow-2xl">
            {stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((activity: any) => (
                <div key={activity.id} className="p-5 flex items-center justify-between hover:bg-brand-800 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-brand-800 flex items-center justify-center border border-brand-700 group-hover:border-gold transition-colors">
                      <Gavel className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-black text-white uppercase italic text-sm">{activity.lots?.title}</h3>
                      <p className="text-xs text-gray-400 font-medium">
                        Lance de <span className="text-white font-black">R$ {activity.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-white tabular-nums">
                      {new Date(activity.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[10px] uppercase font-black tracking-widest text-gold bg-gold/10 px-2 py-0.5 rounded-full inline-block mt-1 border border-gold/20">Realizado</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-gray-500 font-medium italic">
                Nenhuma atividade recente.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg dashboard-title text-white flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-gold" />
            Links Rápidos
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {[
              { label: "Pagar Caução", icon: Wallet, color: "bg-gold/10 text-gold", href: "/painel/saldo" },
              { label: "Meus Arremates", icon: Trophy, color: "bg-gold/10 text-gold", href: "/painel/arrematados" },
              { label: "Enviar Documentos", icon: FileText, color: "bg-gold/10 text-gold", href: "/painel/documentos" },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.href as any}
                className="flex items-center gap-3 p-5 rounded-[2rem] border-2 border-brand-800 bg-brand-900 hover:border-gold transition-all group shadow-xl"
              >
                <div className={cn("p-2 rounded-xl transition-transform group-hover:scale-110", link.color)}>
                  <link.icon className="w-5 h-5" />
                </div>
                <span className="font-black text-white uppercase italic text-sm group-hover:text-gold transition-colors">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-6">
        <AIRecommendations />
      </div>
      
      <OnlineSupport />
    </div>
  );
}
