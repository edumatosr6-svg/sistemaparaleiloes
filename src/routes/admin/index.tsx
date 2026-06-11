import { createFileRoute } from '@tanstack/react-router';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  TrendingUp, 
  Users, 
  Gavel, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const chartData = [
  { name: 'Seg', faturamento: 45000 },
  { name: 'Ter', faturamento: 52000 },
  { name: 'Qua', faturamento: 48000 },
  { name: 'Qui', faturamento: 61000 },
  { name: 'Sex', faturamento: 55000 },
  { name: 'Sáb', faturamento: 67000 },
  { name: 'Dom', faturamento: 82000 },
];

const StatCard = ({ title, value, subValue, icon: Icon, trend }: any) => (
  <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      <div className="p-2 bg-primary/5 rounded-lg">
        <Icon className="w-5 h-5 text-primary" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <div className="flex items-center gap-2 mt-1">
        <span className={cn(
          "text-xs font-medium flex items-center",
          trend > 0 ? "text-green-600" : "text-red-600"
        )}>
          {trend > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {Math.abs(trend)}%
        </span>
        <span className="text-xs text-gray-400">{subValue}</span>
      </div>
    </CardContent>
  </Card>
);

const cn = (...classes: any) => classes.filter(Boolean).join(' ');

export const Route = createFileRoute('/admin/')({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Faturamento Total" 
            value="R$ 1.284.500" 
            subValue="vs. mês passado" 
            icon={DollarSign} 
            trend={12.5} 
          />
          <StatCard 
            title="Leilões Ativos" 
            value="12" 
            subValue="4 encerrando hoje" 
            icon={Gavel} 
            trend={8.2} 
          />
          <StatCard 
            title="Usuários Online" 
            value="342" 
            subValue="em tempo real" 
            icon={Users} 
            trend={24.1} 
          />
          <StatCard 
            title="Total Arrecadado" 
            value="R$ 842.200" 
            subValue="líquido este mês" 
            icon={TrendingUp} 
            trend={-2.4} 
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Desempenho de Vendas</CardTitle>
              <Button variant="outline" size="sm">Mês Atual</Button>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="faturamento" 
                      stroke="#1e3a8a" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorFaturamento)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Distribuição por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Super-Heróis', value: 45 },
                    { name: 'Vilões', value: 30 },
                    { name: 'Anime', value: 15 },
                    { name: 'Épicos', value: 10 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 11}} />
                    <YAxis axisLine={false} tickLine={false} hide />
                    <Bar dataKey="value" fill="#1e3a8a" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Últimos Lances</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary">Ver todos</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-100 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors border border-slate-100">
                        <Users className="w-5 h-5 text-slate-400 group-hover:text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-slate-950 transition-colors">João Silva</p>
                        <p className="text-[10px] text-slate-500 font-medium">Lote #2034 - Fantasia Batman Arkham</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-green-600">R$ 12.500</p>
                      <p className="text-[10px] text-slate-400 font-medium">há 2 minutos</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Próximos Leilões</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary">Ver calendário</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                   { title: 'Super-Heróis Gold', date: 'Hoje, 19:00', type: 'Live' },
                   { title: 'Cosplay Anime Fest', date: 'Amanhã, 14:00', type: 'Simultâneo' },
                   { title: 'Vilões Históricos', date: '15 Mai, 10:00', type: 'Live' },
                ].map((auction, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-primary/20 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <Clock className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{auction.title}</p>
                        <p className="text-xs text-gray-500">{auction.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-[10px] px-2 py-1 rounded-full font-bold uppercase",
                        auction.type === 'Live' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {auction.type}
                      </span>
                      <ExternalLink className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
