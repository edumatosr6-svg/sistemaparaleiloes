import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, Users, Gavel, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';


const data = [
  { name: 'Seg', lances: 400, receita: 2400 },
  { name: 'Ter', lances: 300, receita: 1398 },
  { name: 'Qua', lances: 200, receita: 9800 },
  { name: 'Qui', lances: 278, receita: 3908 },
  { name: 'Sex', lances: 189, receita: 4800 },
  { name: 'Sáb', lances: 239, receita: 3800 },
  { name: 'Dom', lances: 349, receita: 4300 },
];

const pieData = [
  { name: 'Antiguidades', value: 400 },
  { name: 'Veículos', value: 300 },
  { name: 'Imóveis', value: 300 },
  { name: 'Arte', value: 200 },
];

const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b'];

export function AdminAnalytics() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Receita Total" value="R$ 142.000" change="+12.5%" trend="up" icon={DollarSign} />
        <StatCard title="Usuários Ativos" value="1.240" change="+3.2%" trend="up" icon={Users} />
        <StatCard title="Total de Lances" value="8.432" change="-1.5%" trend="down" icon={Gavel} />
        <StatCard title="Taxa de Conversão" value="4.2%" change="+0.8%" trend="up" icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="light border-none shadow-2xl shadow-slate-200/50 bg-white rounded-[2.5rem] overflow-hidden border border-slate-100">
          <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Atividade de Lances</CardTitle>
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorLances" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '1.5rem', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="lances" stroke="#1e3a8a" strokeWidth={3} fillOpacity={1} fill="url(#colorLances)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="light border-none shadow-2xl shadow-slate-200/50 bg-white rounded-[2.5rem] overflow-hidden border border-slate-100">
          <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="p-8 h-[350px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '1.5rem', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, trend, icon: Icon }: any) {
  return (
    <Card className="light border-none shadow-2xl shadow-slate-200/50 bg-white rounded-[2.5rem] overflow-hidden border border-slate-100">
      <CardContent className="p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
            <div className="flex items-center gap-2 mt-4">
              <div className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest",
                trend === 'up' ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
              )}>
                {trend === 'up' ? (
                  <ArrowUpRight className="size-3" />
                ) : (
                  <ArrowDownRight className="size-3" />
                )}
                {change}
              </div>
              <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">vs mês anterior</span>
            </div>
          </div>
          <div className="size-16 rounded-3xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
            <Icon className="size-8 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

