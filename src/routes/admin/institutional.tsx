import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, FileText, Globe } from 'lucide-react';

export const Route = createFileRoute('/admin/institutional')({
  component: AdminInstitutionalPage,
});

const PAGES = [
  { id: 'about', label: 'Sobre Nós', key: 'page_about' },
  { id: 'how-it-works', label: 'Como Funciona', key: 'page_how_it_works' },
  { id: 'terms', label: 'Termos de Uso', key: 'page_terms' },
  { id: 'privacy', label: 'Política de Privacidade', key: 'page_privacy' },
  { id: 'security', label: 'Segurança', key: 'page_security' },
  { id: 'contact', label: 'Contato', key: 'page_contact' },
];

function AdminInstitutionalPage() {
  const [contents, setContents] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchContents = async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .in('key', PAGES.map(p => p.key));
      
      if (!error && data) {
        const map: Record<string, string> = {};
        data.forEach(s => {
          map[s.key] = typeof s.value === 'string' ? s.value : JSON.stringify(s.value);
        });
        setContents(map);
      }
      setLoading(false);
    };
    fetchContents();
  }, []);

  const handleSave = async (key: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
          key, 
          value: contents[key] || '',
          description: `Conteúdo da página ${PAGES.find(p => p.key === key)?.label}`
        }, { onConflict: 'key' });

      if (error) throw error;
      toast.success('Página atualizada com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
              <FileText className="size-8 text-primary" />
              Páginas Institucionais
            </h2>
            <p className="text-slate-500 font-medium mt-1">Gerencie o conteúdo informativo do seu site.</p>
          </div>
        </div>

        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-2xl h-14 w-full justify-start overflow-x-auto">
            {PAGES.map(page => (
              <TabsTrigger 
                key={page.id} 
                value={page.id}
                className="rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white px-6 font-bold uppercase text-[10px] tracking-widest h-12"
              >
                {page.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {PAGES.map(page => (
            <TabsContent key={page.id} value={page.id}>
              <Card className="border-slate-200 shadow-sm rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-900 italic">
                        {page.label}
                      </CardTitle>
                      <CardDescription className="text-sm font-medium">Edite o conteúdo em texto simples ou HTML básico.</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-xl border-slate-200 bg-white"
                      asChild
                    >
                      <a href={`/${page.id}`} target="_blank" rel="noopener noreferrer">
                        <Globe className="size-4 mr-2" />
                        Ver Página
                      </a>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Conteúdo da Página</Label>
                    <Textarea 
                      value={contents[page.key] || ''}
                      onChange={(e) => setContents(prev => ({ ...prev, [page.key]: e.target.value }))}
                      className="min-h-[400px] rounded-3xl bg-slate-50 border-slate-200 p-6 font-mono text-sm leading-relaxed"
                      placeholder="Insira o texto da página aqui..."
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={() => handleSave(page.key)}
                      disabled={saving}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest px-10 h-14 rounded-2xl shadow-xl border-none"
                    >
                      {saving ? (
                        <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                      ) : (
                        <Save className="size-4 mr-2" />
                      )}
                      Salvar Alterações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
