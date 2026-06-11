import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { History, Activity, Search, Filter, Download, User, Database, Clock } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SkeletonPremium } from '@/components/ui/skeleton-premium';
import { cn } from '@/lib/utils';
import { createFileRoute } from '@tanstack/react-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: any;
  new_data: any;
  created_at: string;
}

export const Route = createFileRoute('/admin/audit-logs')({
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const queryClient = useQueryClient();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!error && data) {
        setLogs(data as AuditLog[]);
      }
      setLoading(false);
    };

    fetchLogs();

    // Real-time subscription
    const channel = supabase
      .channel('realtime-audit')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs'
        },
        (payload) => {
          const newLog = payload.new as AuditLog;
          setLogs(prev => [newLog, ...prev].slice(0, 100));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'UPDATE': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'DELETE': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
              <History className="size-8 text-gold" />
              Auditoria em Tempo Real
            </h1>
            <p className="text-muted-foreground font-medium mt-1">Monitoramento live de todas as transações e modificações no ecossistema</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl border-border">
              <Download className="size-4 mr-2" /> Exportar CSV
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Buscar transação..." className="pl-10 w-64 bg-card border-border rounded-xl" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20">
              <Activity className="size-5 text-gold" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Logins (24h)</p>
              <p className="text-xl font-black text-foreground">1,242</p>
            </div>
          </Card>
          <Card className="bg-card border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Database className="size-5 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mudanças DB</p>
              <p className="text-xl font-black text-foreground">{logs.length}+</p>
            </div>
          </Card>
          <Card className="bg-card border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <User className="size-5 text-green-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ações de User</p>
              <p className="text-xl font-black text-foreground">84%</p>
            </div>
          </Card>
          <Card className="bg-card border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <Clock className="size-5 text-red-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Última Atividade</p>
              <p className="text-xl font-black text-foreground">Agora</p>
            </div>
          </Card>
        </div>

        <Card className="bg-card border-border rounded-3xl overflow-hidden shadow-premium">
          <CardHeader className="border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-foreground tracking-tight">Feed de Atividades Live</CardTitle>
                <CardDescription>Fluxo contínuo de eventos do sistema</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Conectado ao DB</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="p-6 flex items-center gap-6">
                    <SkeletonPremium className="size-10 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                      <SkeletonPremium className="h-4 w-1/2" />
                      <SkeletonPremium className="h-3 w-1/4" />
                    </div>
                  </div>
                ))
              ) : logs.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <History className="size-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">Nenhuma atividade registrada</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-5 flex items-start gap-5 hover:bg-muted/30 transition-colors animate-in fade-in slide-in-from-top-1 duration-500">
                    <div className={cn("size-10 rounded-2xl flex items-center justify-center border shrink-0", getActionColor(log.action))}>
                      <Activity className="size-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-foreground">
                          {log.action} em <span className="text-gold">{log.entity_type}</span>
                        </h4>
                        <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3" />
                          {format(new Date(log.created_at), "HH:mm:ss", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          Entidade: <span className="text-foreground font-mono">{log.entity_id?.slice(0, 8)}...</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Usuário: <span className="text-foreground font-bold">{log.user_id?.slice(0, 8) || 'SISTEMA'}</span>
                        </p>
                      </div>
                      <div className="mt-2 p-3 bg-muted rounded-xl border border-border/50 text-[10px] font-mono text-muted-foreground overflow-hidden max-w-full">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(log.new_data || log.old_data, null, 2).slice(0, 200)}...</pre>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
