import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { motion } from "framer-motion";

interface InstitutionalLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function InstitutionalLayout({ title, children }: InstitutionalLayoutProps) {
  return (
    <div className="min-h-screen bg-brand-950 flex flex-col">
      <SiteHeader />
      <main className="flex-1 pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <header className="space-y-4 text-center">
              <h1 className="text-4xl md:text-6xl section-title text-white">
                {title}
              </h1>
              <div className="h-1.5 w-24 bg-gold mx-auto rounded-full" />
            </header>
            
            <article className="prose prose-invert prose-brand max-w-none bg-brand-900/40 p-8 md:p-12 rounded-[2.5rem] border border-brand-800 shadow-2xl backdrop-blur-sm">
              <div className="text-brand-100 font-medium leading-relaxed space-y-6">
                {children}
              </div>
            </article>
          </motion.div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
