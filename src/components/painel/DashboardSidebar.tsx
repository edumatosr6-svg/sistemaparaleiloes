import { Link, useLocation } from "@tanstack/react-router";
import { 
  User, 
  FileText, 
  Wallet, 
  History, 
  Heart, 
  Bell, 
  Gavel, 
  Trophy, 
  CreditCard,
  Settings,
  LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Visão Geral", href: "/painel" },
  { icon: User, label: "Perfil", href: "/painel/perfil" },
  { icon: FileText, label: "Documentos", href: "/painel/documentos" },
  { icon: Wallet, label: "Gestão de Caução", href: "/painel/saldo" },
  { icon: History, label: "Meus Lances", href: "/painel/meus-lances" },
  { icon: Gavel, label: "Auto Bid", href: "/painel/lance-automatico" },
  { icon: Heart, label: "Favoritos", href: "/painel/favoritos" },
  { icon: Bell, label: "Notificações", href: "/painel/notificacoes" },
  { icon: Trophy, label: "Ranking Global", href: "/painel/ranking" },
  { icon: Trophy, label: "Mega Rewards", href: "/painel/recompensas" },
];

const participationItems = [
  { icon: Gavel, label: "Leilões Ativos", href: "/painel/ativos" },
  { icon: Trophy, label: "Meus Arremates", href: "/painel/arrematados" },
  { icon: CreditCard, label: "Pagamentos", href: "/painel/pagamentos" },
];

export function DashboardSidebar() {
  const location = useLocation();

  return (
    <div className="w-64 h-full bg-brand-950 flex flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <h2 className="text-[10px] font-black text-brand-500 uppercase tracking-[0.2em] mb-6 px-3">
          Participações
        </h2>
        <nav className="space-y-1 mb-10">
          {participationItems.map((item) => (
            <Link
              key={item.href}
              to={item.href as any}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                location.pathname === item.href
                  ? "bg-gold text-black shadow-glow-gold"
                  : "text-gray-400 hover:bg-brand-800 hover:text-white"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <h2 className="text-[10px] font-black text-brand-500 uppercase tracking-[0.2em] mb-6 px-3">
          Menu Principal
        </h2>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              to={item.href as any}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                location.pathname === item.href
                  ? "bg-gold text-black shadow-glow-gold"
                  : "text-gray-400 hover:bg-brand-800 hover:text-white"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="shrink-0 p-6 border-t border-brand-800 bg-brand-950">
        <Link
          to="/painel/perfil"
          className="flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-500 rounded-xl hover:bg-brand-800 hover:text-white transition-all"
        >
          <Settings className="w-4 h-4" />
          Configurações
        </Link>
      </div>
    </div>
  );
}
