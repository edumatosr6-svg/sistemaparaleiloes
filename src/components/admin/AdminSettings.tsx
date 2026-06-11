import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Settings, CreditCard, Save, Lock, ShieldCheck } from 'lucide-react';

export function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
      
      if (!error && data) {
        const settingsMap: Record<string, any> = {};
        data.forEach(s => {
          settingsMap[s.key] = s.value;
        });
        setSettings(settingsMap);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async (key: string, value: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
          key, 
          value: typeof value === 'string' ? JSON.stringify(value).replace(/^"(.*)"$/, '$1') : value // Basic JSON handling
        }, { onConflict: 'key' });

      if (error) throw error;
      toast.success(`Configuração ${key} salva com sucesso!`);
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateLocalSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return <div className="p-8 text-center font-black uppercase text-slate-400">Carregando configurações...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
            <Settings className="size-8 text-primary" />
            Configurações do Sistema
          </h2>
          <p className="text-slate-500 font-medium mt-1">Gerencie as chaves de API e comportamentos globais do site.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Methods Settings */}
        <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden col-span-1 md:col-span-2">
          <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
            <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-slate-900">
              <CreditCard className="size-5 text-primary" />
              Configurações de Pagamento
            </CardTitle>
            <CardDescription className="text-xs font-medium">Configure as formas de pagamento aceitas para os arremates.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* PIX Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                    <span className="size-2 rounded-full bg-green-500"></span>
                    Configuração PIX
                  </h3>
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] font-black uppercase">Ativar</Label>
                    <input 
                      type="checkbox" 
                      checked={settings.enable_pix ?? true} 
                      onChange={(e) => {
                        updateLocalSetting('enable_pix', e.target.checked);
                        handleSave('enable_pix', e.target.checked);
                      }}
                      className="size-4 rounded"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Chave PIX</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={settings.pix_key || ''}
                      placeholder="Ex: CNPJ ou E-mail"
                      onChange={(e) => updateLocalSetting('pix_key', e.target.value)}
                      className="h-12 rounded-xl bg-slate-50 border-slate-200 text-slate-900"
                    />
                    <Button 
                      onClick={() => handleSave('pix_key', settings.pix_key)}
                      disabled={saving}
                      className="bg-slate-900 hover:bg-slate-800 rounded-xl px-4"
                    >
                      <Save className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Link do QR Code PIX (Opcional)</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={settings.pix_qr_code_url || ''}
                      placeholder="https://..."
                      onChange={(e) => updateLocalSetting('pix_qr_code_url', e.target.value)}
                      className="h-12 rounded-xl bg-slate-50 border-slate-200 text-slate-900"
                    />
                    <Button 
                      onClick={() => handleSave('pix_qr_code_url', settings.pix_qr_code_url)}
                      disabled={saving}
                      className="bg-slate-900 hover:bg-slate-800 rounded-xl px-4"
                    >
                      <Save className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bank Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                    <span className="size-2 rounded-full bg-blue-500"></span>
                    Dados Bancários
                  </h3>
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] font-black uppercase">Ativar</Label>
                    <input 
                      type="checkbox" 
                      checked={settings.enable_bank_transfer ?? true} 
                      onChange={(e) => {
                        updateLocalSetting('enable_bank_transfer', e.target.checked);
                        handleSave('enable_bank_transfer', e.target.checked);
                      }}
                      className="size-4 rounded"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Detalhes do Banco (Texto Livre)</Label>
                  <div className="flex gap-2">
                    <textarea 
                      value={settings.bank_details || ''}
                      placeholder="Banco: 001, Agência: 1234, Conta: 12345-6..."
                      onChange={(e) => updateLocalSetting('bank_details', e.target.value)}
                      className="flex-1 min-h-[100px] p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none text-slate-900"
                    />
                    <Button 
                      onClick={() => handleSave('bank_details', settings.bank_details)}
                      disabled={saving}
                      className="bg-slate-900 hover:bg-slate-800 rounded-xl h-fit p-3"
                    >
                      <Save className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Mercado Pago Settings */}
              <div className="space-y-4 md:col-span-2 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                    <span className="size-2 rounded-full bg-sky-400"></span>
                    Integração Mercado Pago
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-[10px] font-black uppercase">Checkout Transparente</Label>
                      <input 
                        type="checkbox" 
                        checked={settings.mercadopago_transparent ?? false} 
                        onChange={(e) => {
                          updateLocalSetting('mercadopago_transparent', e.target.checked);
                          handleSave('mercadopago_transparent', e.target.checked);
                        }}
                        className="size-4 rounded"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-[10px] font-black uppercase">Ativar</Label>
                      <input 
                        type="checkbox" 
                        checked={settings.enable_mercadopago ?? false} 
                        onChange={(e) => {
                          updateLocalSetting('enable_mercadopago', e.target.checked);
                          handleSave('enable_mercadopago', e.target.checked);
                        }}
                        className="size-4 rounded"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Chave Pública (Public Key)</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-300" />
                        <Input 
                          type="password"
                          value={settings.mercadopago_public_key || ''}
                          onChange={(e) => updateLocalSetting('mercadopago_public_key', e.target.value)}
                          className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 text-slate-900"
                        />
                      </div>
                      <Button 
                        onClick={() => handleSave('mercadopago_public_key', settings.mercadopago_public_key)}
                        disabled={saving}
                        className="bg-slate-900 hover:bg-slate-800 rounded-xl"
                      >
                        <Save className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Token de Acesso (Access Token)</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-300" />
                        <Input 
                          type="password"
                          value={settings.mercadopago_access_token || ''}
                          onChange={(e) => updateLocalSetting('mercadopago_access_token', e.target.value)}
                          className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 text-slate-900"
                        />
                      </div>
                      <Button 
                        onClick={() => handleSave('mercadopago_access_token', settings.mercadopago_access_token)}
                        disabled={saving}
                        className="bg-slate-900 hover:bg-slate-800 rounded-xl"
                      >
                        <Save className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden md:col-span-2">
          <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
            <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-slate-900">
              <ShieldCheck className="size-5 text-green-600" />
              Segurança e Regras
            </CardTitle>
            <CardDescription className="text-xs font-medium">Controle como o sistema se comporta para novos usuários.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
              <div className="size-8 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Lock className="size-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-black text-amber-900 uppercase">Atenção</p>
                <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                  As chaves de API e dados bancários são sensíveis. Verifique sempre se as informações estão corretas antes de salvar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
