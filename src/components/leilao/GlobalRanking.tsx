import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Star, Flame } from 'lucide-react';

export function GlobalRanking() {
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRankings() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('auction_winners')
          .select(`
            user_id,
            final_amount,
            profiles:profiles(full_name, avatar_url)
          `)
          .eq('escrow_status', 'paid');
        
        if (error) throw error;

        // Group by user
        const grouped = data.reduce((acc: any, curr: any) => {
          const userId = curr.user_id;
          if (!acc[userId]) {
            acc[userId] = {
              id: userId,
              name: curr.profiles?.full_name || 'Arrematante Anônimo',
              avatar_url: curr.profiles?.avatar_url,
              purchases: 0,
              total: 0,
              level: 1, // Default or calculate based on total
              xp: 0,
              status: 'Membro'
            };
          }
          acc[userId].purchases += 1;
          acc[userId].total += Number(curr.final_amount);
          return acc;
        }, {});

        const sorted = Object.values(grouped)
          .sort((a: any, b: any) => b.total - a.total)
          .map((item: any, index: number) => {
            // Add some visual flair based on ranking
            let status = 'Standard';
            if (index === 0) status = '👑 Champion';
            else if (index < 3) status = '🏆 Top Tier';
            else if (index < 10) status = '⭐ Elite';

            return {
              ...item,
              status,
              total: `R$ ${item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              level: Math.floor(item.total / 10000) + 1 // Basic level calculation
            };
          });

        setRankings(sorted);
      } catch (err) {
        console.error('Error fetching rankings:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRankings();
  }, []);

  if (loading) {
    return (
      <Card className="bg-brand-950/40 border-brand-800 animate-pulse">
        <CardContent className="h-64 flex items-center justify-center text-brand-500 font-black uppercase tracking-widest">
          Carregando Ranking...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-brand-950/40 border-brand-800 shadow-glow">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl text-brand-100 flex items-center gap-2">
          <Trophy className="size-6 text-yellow-500" />
          Ranking de Compradores
        </CardTitle>
        <Star className="size-6 text-brand-400" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rankings.map((rank, index) => (
            <div 
              key={rank.id} 
              className="group flex items-center justify-between p-4 rounded-2xl bg-brand-900/30 border border-brand-800/50 hover:bg-brand-800/50 hover:border-brand-600 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <span className={`absolute -top-2 -left-2 size-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg z-10 ${
                    index === 0 ? 'bg-yellow-500 text-black' :
                    index === 1 ? 'bg-gray-300 text-black' :
                    index === 2 ? 'bg-orange-600 text-white' :
                    'bg-brand-700 text-brand-100'
                  }`}>
                    {index + 1}
                  </span>
                  <Avatar className="size-12 border-2 border-brand-700">
                    <AvatarFallback className="bg-brand-800 text-brand-200">
                      {rank.name.split(' ').map((n: any) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-brand-100">{rank.name}</h4>
                    {index === 0 && <Flame className="size-4 text-orange-500 fill-orange-500" />}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase font-bold text-brand-400 bg-brand-950 px-2 py-0.5 rounded">
                      {rank.status}
                    </span>
                    <span className="text-[10px] font-medium text-brand-500">
                      Nível {rank.level}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-brand-100">{rank.total}</p>
                <p className="text-[10px] text-brand-500 mt-1">{rank.purchases} arremates</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
