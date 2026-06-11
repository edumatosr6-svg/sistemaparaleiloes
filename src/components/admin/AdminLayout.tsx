import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { 
  LayoutDashboard, 
  Gavel, 
  Users, 
  Package, 
  Tags, 
  Image as ImageIcon, 
  CreditCard, 
  FileText, 
  BarChart3, 
  Settings,
  ShieldCheck,
  MonitorPlay,
  Menu,
  X,
  LogOut,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin', tooltip: 'Visão geral da plataforma' },
  { label: 'Auditório Live', icon: MonitorPlay, href: '/admin/audit-live', variant: 'premium', tooltip: 'Controle de leilões ao vivo' },
  { label: 'Análise de Dados', icon: BarChart3, href: '/admin/analytics', variant: 'premium', tooltip: 'Métricas e performance' },
  { label: 'Leilões', icon: Gavel, href: '/admin/auctions', tooltip: 'Gerenciamento de eventos' },
  { label: 'Lotes / Produtos', icon: Package, href: '/admin/lots', tooltip: 'Cadastro e edição de itens' },
  { label: 'Lotes Vendidos', icon: Trophy, href: '/admin/sold-lots', tooltip: 'Histórico de arremates' },
  { label: 'Usuários', icon: Users, href: '/admin/users', tooltip: 'Gestão de clientes e acessos' },
  { label: 'Categorias', icon: Tags, href: '/admin/categories', tooltip: 'Organização do catálogo' },
  { label: 'Banners', icon: ImageIcon, href: '/admin/banners', tooltip: 'Publicidade do site' },
  { label: 'Caução', icon: ShieldCheck, href: '/admin/caucao', tooltip: 'Controle de garantias financeiras' },
  { label: 'Pagamentos', icon: CreditCard, href: '/admin/payments', tooltip: 'Validação de comprovantes' },
  { label: 'Contratos', icon: FileText, href: '/admin/contracts', tooltip: 'Documentos e assinaturas' },
  { label: 'Relatórios', icon: BarChart3, href: '/admin/reports', tooltip: 'Exportação de dados' },
  { label: 'Auditoria de Encerramento', icon: ShieldCheck, href: '/admin/audit-closings', variant: 'premium', tooltip: 'Revisão final de leilões' },
  { label: 'Histórico de PDFs', icon: FileText, href: '/admin/pdf-history', tooltip: 'Arquivos gerados' },
  { label: 'Páginas Institucionais', icon: FileText, href: '/admin/institutional', tooltip: 'Conteúdo do site' },
  { label: 'Saúde de Segurança', icon: ShieldCheck, href: '/admin/seguranca', variant: 'premium', tooltip: 'Monitoramento de integridade' },
  { label: 'Logs de Auditoria', icon: FileText, href: '/admin/audit-logs', variant: 'premium', tooltip: 'Rastro de ações administrativas' },
  { label: 'Configurações', icon: Settings, href: '/admin/settings', tooltip: 'Ajustes globais do sistema' },
];

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['admin-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user
  });

  if (authLoading || profileLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4">
        <ShieldCheck className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Acesso Restrito</h2>
        <p className="text-slate-500 text-center max-w-md mb-8">
          Você precisa estar logado com uma conta de administrador para acessar esta área.
        </p>
        <div className="flex gap-4">
          <Link to="/" className="bg-white text-slate-900 border border-slate-200 px-8 py-3 rounded-2xl font-bold">
            Voltar para Home
          </Link>
          <Link to="/entrar" className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold">
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans light selection:bg-primary/20">
        {/* Sidebar */}
        <aside 
          className={cn(
            "bg-white border-r border-slate-200 transition-all duration-300 flex flex-col shadow-sm z-20",
            isSidebarOpen ? "w-64" : "w-20"
          )}
        >
          <div className="p-6 flex items-center justify-between border-b border-slate-100">
            {isSidebarOpen ? (
              <span className="text-xl font-black tracking-tighter text-slate-900">
                PAINEL <span className="text-primary">ADMIN</span>
              </span>
            ) : (
              <Gavel className="w-8 h-8 text-primary mx-auto" />
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:flex hover:bg-slate-100"
            >
              {isSidebarOpen ? <X className="w-4 h-4 text-slate-500" /> : <Menu className="w-4 h-4 text-slate-500" />}
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                      location.pathname === item.href 
                        ? "bg-primary text-white shadow-lg shadow-primary/20" 
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      item.variant === 'premium' && location.pathname !== item.href && "text-primary font-bold"
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 shrink-0 transition-colors",
                      location.pathname === item.href ? "text-white" : "group-hover:text-primary"
                    )} />
                    {isSidebarOpen && <span className="text-sm font-semibold tracking-tight">{item.label}</span>}
                    {isSidebarOpen && item.variant === 'premium' && (
                      <span className="ml-auto text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase font-black tracking-widest">
                        Live
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                {!isSidebarOpen && (
                  <TooltipContent side="right">
                    <p className="font-bold text-xs uppercase tracking-widest">{item.label}</p>
                  </TooltipContent>
                )}
                {isSidebarOpen && (
                  <TooltipContent side="right" className="bg-slate-900 text-white border-none shadow-xl">
                    <p className="text-[10px] font-bold uppercase tracking-widest">{item.tooltip}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <Button 
              variant="ghost" 
              className={cn(
                "w-full flex items-center gap-3 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all rounded-xl",
                !isSidebarOpen && "justify-center"
              )}
              onClick={() => {
                supabase.auth.signOut();
                window.location.href = '/';
              }}
            >
              <LogOut className="w-5 h-5" />
              {isSidebarOpen && <span className="text-sm font-bold uppercase tracking-wider">Sair</span>}
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden relative light">
          {/* Header */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10 light">
            <div className="flex items-center gap-4">
              <h1 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">
                {navItems.find(item => item.href === location.pathname)?.label || 'Painel'}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">Administrador</p>
                <p className="text-[10px] text-primary uppercase font-black tracking-widest">Acesso Total</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-slate-200">
                AD
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F8FAFC]">
            <div className="max-w-[1600px] mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};