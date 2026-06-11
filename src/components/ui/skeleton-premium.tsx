import { motion } from "framer-motion";

export function SkeletonPremium({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-muted rounded-2xl ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "linear",
        }}
      />
    </div>
  );
}
