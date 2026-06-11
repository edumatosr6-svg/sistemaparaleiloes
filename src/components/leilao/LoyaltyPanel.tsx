import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Gift, Share2, Ticket, Percent, Users, Copy, Check, 
  Wallet, TrendingUp, Award, Zap, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export function LoyaltyPanel() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [affiliate, setAffiliate] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        setLoading(true);
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profileData);

        // Fetch affiliate data
        const { data: affiliateData } = await supabase
          .from('affiliates')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (affiliateData) {
          setAffiliate(affiliateData);
        } else {
          // Create affiliate record if it doesn't exist
          const code = `HERO-${user.id.slice(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
          const { data: newAffiliate, error: createError } = await supabase
            .from('affiliates')
            .insert({
              user_id: user.id,
              affiliate_code: code,
              commission_rate: 5.0
            })
            .select()
            .single();
          
          if (!createError) setAffiliate(newAffiliate);
        }
      } catch (error) {
        console.error("Error fetching loyalty data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const copyToClipboard = () => {
    if (!affiliate?.affiliate_code) return;
    const url = `${window.location.origin}/entrar?ref=${affiliate.affiliate_code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link de afiliado copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const applyCoupon = async () => {
    if (!coupon) return;
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', coupon.toUpperCase())
        .maybeSingle();
      
      if (error) throw error;
      if (!data) {
        toast.error("Cupom inválido ou expirado.");
        return;
      }
      
      if (data.usage_limit && (data.usage_count || 0) >= data.usage_limit) {
        toast.error("Este cupom atingiu o limite de usos.");
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast.error("Este cupom expirou.");
        return;
      }

      toast.success(`Cupom ${coupon} aplicado com sucesso! Desconto de ${data.discount_percentage}% nas taxas.`);
    } catch (error: any) {
      toast.error("Erro ao aplicar cupom.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <Card className="bg-brand-950/40 border-brand-800 shadow-xl overflow-hidden">
      <div className="bg-brand-600/10 p-6 border-b border-brand-800">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-brand-600 flex items-center justify-center shadow-glow">
            <Award className="size-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-brand-100 italic uppercase tracking-tighter">Hero Rewards</h2>
            <p className="text-brand-400 text-sm font-medium">Ganhe prêmios e benefícios exclusivos</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="affiliates" className="w-full">
        <TabsList className="w-full bg-brand-950/50 rounded-none border-b border-brand-800 p-0 h-14">
          <TabsTrigger value="affiliates" className="flex-1 data-[state=active]:bg-brand-800/50 rounded-none h-full gap-2 font-black uppercase tracking-widest text-[10px]">
            <Share2 className="size-4" /> Afiliados
          </TabsTrigger>
          <TabsTrigger value="coupons" className="flex-1 data-[state=active]:bg-brand-800/50 rounded-none h-full gap-2 font-black uppercase tracking-widest text-[10px]">
            <Ticket className="size-4" /> Cupons
          </TabsTrigger>
          <TabsTrigger value="cashback" className="flex-1 data-[state=active]:bg-brand-800/50 rounded-none h-full gap-2 font-black uppercase tracking-widest text-[10px]">
            <Wallet className="size-4" /> Cashback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="affiliates" className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-black text-white uppercase italic flex items-center gap-2">
                <Users className="size-5 text-gold" />
                Programa de Afiliados
              </h3>
              <p className="text-sm text-brand-400 leading-relaxed font-medium">
                Convide seus amigos e ganhe <span className="text-gold font-black italic">{affiliate?.commission_rate || 5}% de comissão</span> sobre cada arremate realizado por eles durante 1 ano.
              </p>
              
              <div className="flex gap-2">
                <div className="flex-1 bg-brand-950 border border-brand-800 rounded-xl px-4 flex items-center text-brand-200 text-sm font-mono font-bold tracking-wider">
                  {affiliate?.affiliate_code}
                </div>
                <Button variant="outline" size="icon" className="rounded-xl border-brand-800" onClick={copyToClipboard}>
                  {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-brand-900/40 rounded-3xl p-6 border border-brand-800/50 shadow-inner">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Seu desempenho</span>
                <TrendingUp className="size-4 text-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-brand-500 font-black uppercase tracking-widest">Comissão</p>
                  <p className="text-2xl font-black text-white italic tracking-tighter">
                    {affiliate?.commission_rate || 5}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-brand-500 font-black uppercase tracking-widest">Ganhos totais</p>
                  <p className="text-2xl font-black text-green-400 italic tracking-tighter">
                    R$ {Number(affiliate?.total_earnings || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="coupons" className="p-6">
          <div className="max-w-md mx-auto space-y-6 text-center py-10">
            <div className="size-20 rounded-[2rem] bg-brand-800/50 flex items-center justify-center mx-auto mb-4 shadow-glow-gold rotate-3">
              <Percent className="size-10 text-gold" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Ativar Cupom</h3>
              <p className="text-sm text-brand-400 font-medium mt-2">
                Insira o código do seu cupom para ganhar descontos em taxas ou créditos extras.
              </p>
            </div>
            <div className="flex gap-3 max-w-sm mx-auto">
              <Input 
                placeholder="Ex: HERO5" 
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                className="bg-brand-950 border-brand-800 text-brand-100 uppercase font-bold h-12 rounded-2xl text-center tracking-widest"
              />
              <Button onClick={applyCoupon} className="bg-gold text-black hover:bg-gold-light font-black uppercase tracking-widest px-8 rounded-2xl h-12 shadow-glow-gold">
                Aplicar
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cashback" className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-brand-950 border-brand-800 rounded-3xl border-2">
              <CardContent className="p-6 text-center">
                <p className="text-[10px] text-brand-500 font-black uppercase tracking-widest mb-1">Pontos Acumulados</p>
                <p className="text-3xl font-black text-white italic tracking-tighter">{profile?.points || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-brand-950 border-brand-800 rounded-3xl border-2">
              <CardContent className="p-6 text-center">
                <p className="text-[10px] text-brand-500 font-black uppercase tracking-widest mb-1">Nível Atual</p>
                <p className="text-3xl font-black text-gold italic tracking-tighter">Nível {profile?.level || 1}</p>
              </CardContent>
            </Card>
            <Card className="bg-brand-950 border-brand-800 rounded-3xl border-2">
              <CardContent className="p-6 text-center">
                <p className="text-[10px] text-brand-500 font-black uppercase tracking-widest mb-1">Status VIP</p>
                <p className={cn("text-3xl font-black italic tracking-tighter", profile?.is_vip ? "text-purple-400" : "text-gray-500")}>
                  {profile?.is_vip ? "ATIVO" : "INATIVO"}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8 p-6 rounded-[2rem] bg-blue-900/10 border-2 border-blue-500/20 flex items-center gap-6 shadow-2xl">
            <div className="size-14 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0">
              <Zap className="size-8 text-blue-400 animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-black text-white uppercase italic tracking-tighter">Benefícios do Programa</p>
              <p className="text-sm text-brand-400 font-medium">Como membro Hero, você acumula pontos em cada lance e recebe cashback exclusivo em arremates vitoriosos.</p>
            </div>
            <Button variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl font-black uppercase tracking-widest text-[10px]">
              Ver Tabela de Níveis
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
