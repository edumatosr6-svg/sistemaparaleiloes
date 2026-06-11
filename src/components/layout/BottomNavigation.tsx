import { Home, Gavel, LayoutDashboard, User, Wallet } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function BottomNavigation() {
  const location = useLocation();
  const currentPath = location.pathname;

  const items = [
    { icon: Home, label: "Início", href: "/" },
    { icon: Gavel, label: "Leilões", href: "/active-auctions" }, // Assumindo uma rota de leilões ativos
    { icon: Wallet, label: "Carteira", href: "/painel/saldo" },
    { icon: LayoutDashboard, label: "Painel", href: "/painel" },
    { icon: User, label: "Perfil", href: "/painel/perfil" },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      <nav className="glass-card rounded-2xl flex items-center justify-around py-2 px-1 relative overflow-hidden">
        {items.map((item) => {
          const isActive = currentPath === item.href || (item.href !== "/" && currentPath.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1 relative z-10 transition-all duration-300 w-full",
                isActive ? "text-gold" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 mb-1", isActive && "scale-110")} />
              <span className="text-[10px] font-medium">{item.label}</span>
              
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 bg-gold/10 rounded-xl -z-10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
