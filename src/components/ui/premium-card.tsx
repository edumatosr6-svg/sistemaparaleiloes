import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function PremiumCard({ children, className, glow = false }: PremiumCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "relative rounded-3xl overflow-hidden glass-card",
        glow && "shadow-glow",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
}
