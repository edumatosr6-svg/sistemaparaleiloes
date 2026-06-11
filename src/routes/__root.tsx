import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar para Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado do nosso lado. Você pode tentar atualizar a página ou voltar para a home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar para home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Mega Leilões Hot Toys | O Maior Leilão de Colecionáveis do Brasil" },
      { name: "description", content: "Participe dos melhores leilões de Hot Toys, estátuas e colecionáveis premium. Segurança, transparência e itens exclusivos para sua coleção." },
      { name: "author", content: "Mega Leilões Hot Toys" },
      { property: "og:title", content: "Mega Leilões Hot Toys | O Maior Leilão de Colecionáveis do Brasil" },
      { property: "og:description", content: "Participe dos melhores leilões de Hot Toys, estátuas e colecionáveis premium. Segurança, transparência e itens exclusivos para sua coleção." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@MegaLeiloes" },
      { name: "twitter:title", content: "Mega Leilões Hot Toys | O Maior Leilão de Colecionáveis do Brasil" },
      { name: "twitter:description", content: "Participe dos melhores leilões de Hot Toys, estátuas e colecionáveis premium." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/yUs7PFF1kBUVnmZVRZO69SAypL12/social-images/social-1778633829530-Design_sem_nome_(21).webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/yUs7PFF1kBUVnmZVRZO69SAypL12/social-images/social-1778633829530-Design_sem_nome_(21).webp" },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,100..900;1,100..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
    scripts: [
      {
        src: "https://sdk.mercadopago.com/js/v2",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { FloatingWhatsApp } from "@/components/leilao/FloatingWhatsApp";
import { NotificationListener } from "@/components/notifications/NotificationListener";
import { ThemeStyles } from "@/components/ThemeStyles";

import { SEO } from "@/components/SEO";

import { PerformanceMonitor } from "@/components/PerformanceMonitor";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <SEO />
      <PerformanceMonitor />
      <ThemeStyles />
      <Outlet />
      <NotificationListener />
      <FloatingWhatsApp />
      <Toaster />
    </QueryClientProvider>
  );
}
