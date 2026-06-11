import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Shield, ShieldAlert, ShieldCheck, RefreshCw, AlertTriangle, Table } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkeletonPremium } from '@/components/ui/skeleton-premium';
import { createFileRoute } from '@tanstack/react-router';

interface TableHealth {
  tablename: string;
  rls_enabled: boolean;
  policy_count: number;
}

export const Route = createFileRoute('/admin/security')({
  component: SecurityHealthPage,
});

function SecurityHealthPage() {
  const { data: healthStatus, isLoading, refetch } = useQuery({
    queryKey: ['security-health'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_health_status')
        .select('*');
      if (error) throw error;
      return data as TableHealth[];
    }
  });

  const insecureTables = healthStatus?.filter(t => !t.rls_enabled) || [];
  const secureTables = healthStatus?.filter(t => t.rls_enabled) || [];

  return (
    <AdminLayout>
      <div className="space-y-8 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
              <Shield className="size-8 text-gold" />
              Verificador de RLS
            </h1>
            <p className="text-muted-foreground font-medium mt-1">Monitoramento de Row Level Security e Compliance do Banco de Dados</p>
          </div>
          <Button variant="outline" className="rounded-xl border-border" onClick={() => refetch()}>
            <RefreshCw className="size-4 mr-2" />
            Atualizar Status
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border rounded-3xl overflow-hidden shadow-premium">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status Geral</CardDescription>
              <CardTitle className="text-2xl font-black text-foreground">
                {insecureTables.length === 0 ? 'Protegido' : 'Risco Detectado'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mt-2">
                {insecureTables.length === 0 ? (
                  <div className="size-12 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                    <ShieldCheck className="size-6 text-green-500" />
                  </div>
                ) : (
                  <div className="size-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 animate-pulse">
                    <ShieldAlert className="size-6 text-red-500" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-foreground">{healthStatus?.length || 0} Tabelas Mapeadas</p>
                  <p className="text-xs text-muted-foreground">{insecureTables.length} Tabelas sem RLS</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border rounded-3xl overflow-hidden shadow-premium">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Políticas Ativas</CardDescription>
              <CardTitle className="text-2xl font-black text-foreground">
                {healthStatus?.reduce((acc, t) => acc + (t.policy_count || 0), 0) || 0} Regras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mt-2">
                <div className="size-12 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20">
                  <Table className="size-6 text-gold" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Escopo de Acesso</p>
                  <p className="text-xs text-muted-foreground">Média de {((healthStatus?.reduce((acc, t) => acc + (t.policy_count || 0), 0) || 0) / (healthStatus?.length || 1)).toFixed(1)} políticas/tabela</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border rounded-3xl overflow-hidden shadow-premium bg-gradient-to-br from-gold/5 to-transparent">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nível de Compliance</CardDescription>
              <CardTitle className="text-2xl font-black text-foreground">
                {healthStatus ? Math.round((secureTables.length / healthStatus.length) * 100) : 0}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-2 bg-muted rounded-full mt-4 overflow-hidden">
                <div 
                  className="h-full bg-gold transition-all duration-1000" 
                  style={{ width: `${healthStatus ? (secureTables.length / healthStatus.length) * 100 : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border rounded-3xl overflow-hidden shadow-premium">
          <CardHeader>
            <CardTitle className="text-xl font-black text-foreground tracking-tight">Inventário de Segurança</CardTitle>
            <CardDescription>Lista completa de tabelas e seu estado de proteção Row Level Security</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted/50 border-y border-border text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    <th className="px-6 py-4">Tabela</th>
                    <th className="px-6 py-4">Status RLS</th>
                    <th className="px-6 py-4">Políticas</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    [1, 2, 3, 4, 5].map(i => (
                      <tr key={i}>
                        <td className="px-6 py-4"><SkeletonPremium className="h-4 w-32" /></td>
                        <td className="px-6 py-4"><SkeletonPremium className="h-6 w-20" /></td>
                        <td className="px-6 py-4"><SkeletonPremium className="h-4 w-12" /></td>
                        <td className="px-6 py-4 text-right"><SkeletonPremium className="h-8 w-24 ml-auto" /></td>
                      </tr>
                    ))
                  ) : (
                    healthStatus?.map((table) => (
                      <tr key={table.tablename} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Table className="size-4 text-muted-foreground group-hover:text-gold transition-colors" />
                            <span className="font-bold text-sm text-foreground">{table.tablename}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {table.rls_enabled ? (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] font-black uppercase tracking-widest">Ativado</Badge>
                          ) : (
                            <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] font-black uppercase tracking-widest">Desativado</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold tabular-nums text-sm">{table.policy_count} políticas</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!table.rls_enabled && (
                            <Button size="sm" variant="destructive" className="h-8 text-[9px] font-black uppercase tracking-widest rounded-lg">
                              <AlertTriangle className="size-3 mr-1" /> Corrigir RLS
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
