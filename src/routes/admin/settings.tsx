import { createFileRoute } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Globe, Phone, MessageCircle, User, Award, Mail, MapPin, Image as ImageIcon, MonitorPlay, CreditCard, Lock, Send, Play, Maximize2, Palette, Trash2, Smartphone, Tablet, Monitor, QrCode, Wallet, CheckCircle2, Home, Layout, CheckCircle, XCircle, Info, Sparkles } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HomeEditor } from '@/components/admin/settings/HomeEditor';
import { ThemeEditor } from '@/components/admin/settings/ThemeEditor';
import { FooterEditor } from '@/components/admin/settings/FooterEditor';

export const Route = createFileRoute('/admin/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    logo_url: '',
    auctioneer_name: '',
    auctioneer_registration: '',
    logo_height: 40,
    email: '',
    address: '',
    mercadopago_public_key: '',
    mercadopago_access_token: '',
    enable_mercadopago: false,
    mercadopago_transparent: false,
    pix_key: '',
    pix_qr_code_url: '',
    enable_pix: false,
    bank_details: '',
    enable_bank_transfer: false,
    instagram_url: '',
    facebook_url: '',
    twitter_url: '',
    youtube_url: '',
    hero_font_size: 100,
    hero_letter_spacing: -4,
    hero_line_height: 90,
    section_font_size: 100,
    section_letter_spacing: -4,
    section_line_height: 90,
    card_font_size: 100,
    card_letter_spacing: -4,
    card_line_height: 90,
    dashboard_font_size: 100,
    dashboard_letter_spacing: -4,
    dashboard_line_height: 90,
    button_font_size: 100,
    button_letter_spacing: 5,
    button_line_height: 100,
    google_safe_url: '',
    mercado_pago_banner_url: '',
    pix_banner_url: '',
    cards_banner_url: '',
    security_seal_url: '',
    seo_main_keyword: '',
    seo_related_keywords: '',
    seo_title_template: '',
    seo_description_template: '',
    google_analytics_id: '',
    facebook_pixel_id: '',
    google_site_verification: ''
  });

  const [stylePresets, setStylePresets] = useState<any[]>([]);

  const defaultPresets = [
    { name: 'Agressivo (Padrão)', font_size: 100, letter_spacing: -5, line_height: 85 },
    { name: 'Elegante / Espaçado', font_size: 90, letter_spacing: 5, line_height: 100 },
    { name: 'Impacto Máximo', font_size: 120, letter_spacing: -8, line_height: 80 },
    { name: 'Minimalista', font_size: 85, letter_spacing: 0, line_height: 110 }
  ];

  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [selectedArea, setSelectedArea] = useState<'hero' | 'section' | 'card' | 'dashboard' | 'button'>('hero');
  
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
      
      if (error) throw error;
      
      const config: any = {};
      data?.forEach(item => {
        if (item.key === 'site_config') {
          Object.assign(config, item.value);
        } else {
          config[item.key] = item.value;
        }
      });
      return config;
    }
  });

  useEffect(() => {
    if (settingsData) {
      const s = settingsData;
      setFormData({
        name: s.name || '',
        phone: s.phone || '',
        whatsapp: s.whatsapp || '',
        logo_url: s.logo_url || '',
        auctioneer_name: s.auctioneer_name || '',
        auctioneer_registration: s.auctioneer_registration || '',
        logo_height: Number(s.logo_height) || 40,
        email: s.email || '',
        address: s.address || '',
        mercadopago_public_key: s.mercadopago_public_key || '',
        mercadopago_access_token: s.mercadopago_access_token || '',
        enable_mercadopago: s.enable_mercadopago === true,
        mercadopago_transparent: s.mercadopago_transparent === true,
        pix_key: s.pix_key || '',
        pix_qr_code_url: s.pix_qr_code_url || '',
        enable_pix: s.enable_pix === true,
        bank_details: s.bank_details || '',
        enable_bank_transfer: s.enable_bank_transfer === true,
        instagram_url: s.instagram_url || '',
        facebook_url: s.facebook_url || '',
        twitter_url: s.twitter_url || '',
        youtube_url: s.youtube_url || '',
        hero_font_size: Number(s.hero_font_size) || 100,
        hero_letter_spacing: Number(s.hero_letter_spacing) || -4,
        hero_line_height: Number(s.hero_line_height) || 90,
        section_font_size: Number(s.section_font_size) || 100,
        section_letter_spacing: Number(s.section_letter_spacing) || -4,
        section_line_height: Number(s.section_line_height) || 90,
        card_font_size: Number(s.card_font_size) || 100,
        card_letter_spacing: Number(s.card_letter_spacing) || -4,
        card_line_height: Number(s.card_line_height) || 90,
        dashboard_font_size: Number(s.dashboard_font_size) || 100,
        dashboard_letter_spacing: Number(s.dashboard_letter_spacing) || -4,
        dashboard_line_height: Number(s.dashboard_line_height) || 90,
        button_font_size: Number(s.button_font_size) || 100,
        button_letter_spacing: Number(s.button_letter_spacing) || 5,
        button_line_height: Number(s.button_line_height) || 100,
        google_safe_url: s.google_safe_url || '',
        mercado_pago_banner_url: s.mercado_pago_banner_url || '',
        pix_banner_url: s.pix_banner_url || '',
        cards_banner_url: s.cards_banner_url || '',
        security_seal_url: s.security_seal_url || '',
        seo_main_keyword: s.seo_main_keyword || '',
        seo_related_keywords: s.seo_related_keywords || '',
        seo_title_template: s.seo_title_template || '',
        seo_description_template: s.seo_description_template || '',
        google_analytics_id: s.google_analytics_id || '',
        facebook_pixel_id: s.facebook_pixel_id || '',
        google_site_verification: s.google_site_verification || ''
      });

      if (s.style_presets) {
        setStylePresets(s.style_presets);
      }
    }
  }, [settingsData]);

  const updateMutation = useMutation({
    mutationFn: async (newData: any) => {
      const { mercadopago_public_key, mercadopago_access_token, ...siteConfig } = newData;
      
      const updates = [
        supabase.from('system_settings').upsert({ 
          key: 'site_config', 
          value: siteConfig,
          updated_at: new Date().toISOString()
        }),
        supabase.from('system_settings').upsert({ 
          key: 'mercadopago_public_key', 
          value: mercadopago_public_key,
          updated_at: new Date().toISOString()
        }),
        supabase.from('system_settings').upsert({ 
          key: 'mercadopago_access_token', 
          value: mercadopago_access_token,
          updated_at: new Date().toISOString()
        })
      ];
      
      const results = await Promise.all(updates);
      const firstError = results.find(r => r.error)?.error;
      if (firstError) throw firstError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('Configurações atualizadas com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar configurações: ' + error.message);
    }
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateMutation.mutate({ ...formData, style_presets: stylePresets });
  };

  if (isLoading) return <div className="p-20 text-center uppercase font-black text-slate-400 animate-pulse tracking-widest">Carregando configurações...</div>;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-10 pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-4">Configurações da Plataforma</h2>
            <p className="text-slate-500 font-medium text-sm">Controle a identidade visual, blocos da home e dados operacionais.</p>
          </div>
          <Button onClick={() => handleSubmit()} disabled={updateMutation.isPending} className="h-14 px-8 bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-xl shadow-primary/20 font-black uppercase tracking-widest text-[10px]">
            <Save className="w-4 h-4 mr-2" /> Salvar Configurações
          </Button>
        </div>

        <Tabs defaultValue="design" className="space-y-8">
          <TabsList className="bg-slate-100 p-1.5 rounded-2xl h-auto flex flex-wrap gap-1">
            <TabsTrigger value="geral" className="rounded-xl px-6 py-3 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Globe className="size-4 mr-2" /> Geral
            </TabsTrigger>
            <TabsTrigger value="design" className="rounded-xl px-6 py-3 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Palette className="size-4 mr-2" /> Design & Tipografia
            </TabsTrigger>
            <TabsTrigger value="home" className="rounded-xl px-6 py-3 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Layout className="size-4 mr-2" /> Home Page
            </TabsTrigger>
            <TabsTrigger value="pagamentos" className="rounded-xl px-6 py-3 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <CreditCard className="size-4 mr-2" /> Pagamentos
            </TabsTrigger>
            <TabsTrigger value="footer" className="rounded-xl px-6 py-3 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Layout className="size-4 mr-2" /> Rodapé
            </TabsTrigger>
            <TabsTrigger value="seo" className="rounded-xl px-6 py-3 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Globe className="size-4 mr-2" /> SEO & Rastreio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="mt-0 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-8">
                <Card className="border-none shadow-2xl shadow-slate-200 overflow-hidden rounded-[2.5rem] bg-white border border-slate-100">
                  <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-primary" /> Logomarca Principal
                    </h3>
                  </div>
                  <CardContent className="p-8">
                    <ImageUpload 
                      value={formData.logo_url}
                      onChange={(url) => setFormData({ ...formData, logo_url: url })}
                       bucket="site-assets"
                    />
                    <div className="mt-8 space-y-6">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tamanho da Logomarca (Altura)</Label>
                        <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-lg">{formData.logo_height}px</span>
                      </div>
                      <Slider 
                        value={[formData.logo_height]} 
                        onValueChange={(val) => setFormData({ ...formData, logo_height: val[0] })}
                        min={20}
                        max={120}
                        step={1}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-8 space-y-8">
                <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white border border-slate-100">
                  <div className="p-8 border-b border-slate-50">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Dados Institucionais</h3>
                  </div>
                  <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome da Empresa</Label>
                        <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-14 rounded-2xl" />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-500">E-mail</Label>
                        <Input id="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-14 rounded-2xl" />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Telefone</Label>
                        <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-14 rounded-2xl" />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="whatsapp" className="text-[10px] font-black uppercase tracking-widest text-slate-500">WhatsApp</Label>
                        <Input id="whatsapp" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} className="h-14 rounded-2xl" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Endereço</Label>
                      <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="h-14 rounded-2xl" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white border border-slate-100">
                  <div className="p-8 border-b border-slate-50">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Leiloeiro</h3>
                  </div>
                  <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label htmlFor="auc_name" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome</Label>
                      <Input id="auc_name" value={formData.auctioneer_name} onChange={(e) => setFormData({ ...formData, auctioneer_name: e.target.value })} className="h-14 rounded-2xl" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="auc_reg" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Matrícula</Label>
                      <Input id="auc_reg" value={formData.auctioneer_registration} onChange={(e) => setFormData({ ...formData, auctioneer_registration: e.target.value })} className="h-14 rounded-2xl" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pagamentos" className="mt-0 space-y-8">
            <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white border border-slate-100">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Métodos de Pagamento</h3>
                  <p className="text-slate-500 font-medium text-xs mt-1">Configure como seus usuários podem pagar pelos arremates.</p>
                </div>
              </div>
              <CardContent className="p-8 space-y-12">
                <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                      <QrCode className="size-6 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="font-black uppercase tracking-tight text-slate-900">Pagamento via PIX</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Habilitar recebimento instantâneo</p>
                    </div>
                  </div>
                  <Switch 
                    checked={formData.enable_pix} 
                    onCheckedChange={(checked) => setFormData({ ...formData, enable_pix: checked })} 
                  />
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label htmlFor="pix_key" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Chave PIX</Label>
                      <Input id="pix_key" value={formData.pix_key} onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })} className="h-14 rounded-2xl" placeholder="E-mail, CPF, CNPJ ou Celular" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">QR Code PIX (Opcional)</Label>
                      <ImageUpload 
                        value={formData.pix_qr_code_url}
                        onChange={(url) => setFormData({ ...formData, pix_qr_code_url: url })}
                        bucket="site-assets"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                      <Wallet className="size-6 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-black uppercase tracking-tight text-slate-900">Mercado Pago</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cartão de Crédito e Parcelamento</p>
                    </div>
                  </div>
                  <Switch 
                    checked={formData.enable_mercadopago} 
                    onCheckedChange={(checked) => setFormData({ ...formData, enable_mercadopago: checked })} 
                  />
                </div>

                {formData.enable_mercadopago && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="mp_public" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Public Key</Label>
                        <Input id="mp_public" type="password" value={formData.mercadopago_public_key} onChange={(e) => setFormData({ ...formData, mercadopago_public_key: e.target.value })} className="h-14 rounded-2xl" />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="mp_access" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Access Token</Label>
                        <Input id="mp_access" type="password" value={formData.mercadopago_access_token} onChange={(e) => setFormData({ ...formData, mercadopago_access_token: e.target.value })} className="h-14 rounded-2xl" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                      <Switch 
                        checked={formData.mercadopago_transparent} 
                        onCheckedChange={(checked) => setFormData({ ...formData, mercadopago_transparent: checked })} 
                      />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-tight text-blue-900">Checkout Transparente</p>
                        <p className="text-[9px] font-bold text-blue-700/60 uppercase tracking-widest">O usuário não sai do site para pagar.</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="footer" className="mt-0 space-y-8">
            <FooterEditor formData={formData} setFormData={setFormData} />
          </TabsContent>

          <TabsContent value="seo" className="mt-0 space-y-8">
            <div className="grid grid-cols-1 gap-8">
              <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-brand-900 text-white border border-brand-800 overflow-hidden">
                <div className="p-8 border-b border-white/5 bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-gold/20 flex items-center justify-center">
                      <Sparkles className="size-6 text-gold" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight">Checklist de Saúde SEO</h3>
                      <p className="text-white/40 font-medium text-xs">Acompanhe a implementação da sua estrutura de ranqueamento.</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { label: 'Palavra-Chave Principal', status: !!formData.seo_main_keyword, desc: 'Define o foco do ranqueamento.' },
                      { label: 'SEO Templates', status: !!formData.seo_title_template && !!formData.seo_description_template, desc: 'Títulos e descrições dinâmicas.' },
                      { label: 'Google Analytics', status: !!formData.google_analytics_id, desc: 'Rastreio de visitantes ativo.' },
                      { label: 'Facebook Pixel', status: !!formData.facebook_pixel_id, desc: 'Rastreio de conversões ativo.' },
                      { label: 'Sitemap XML', status: true, desc: 'Gerado automaticamente em /sitemap.xml' },
                      { label: 'Robots.txt', status: true, desc: 'Configurado para permitir indexação.' },
                      { label: 'Schemas (JSON-LD)', status: true, desc: 'Rich Results para Lotes e Leilões.' },
                      { label: 'Tags Canônicas', status: true, desc: 'Evita conteúdo duplicado.' },
                      { label: 'Twitter Cards / OG', status: true, desc: 'Otimizado para redes sociais.' },
                      { label: 'Smart Alt Text', status: true, desc: 'Palavras-chave automáticas em imagens.' },
                      { label: 'Google Verification', status: !!formData.google_site_verification, desc: 'Propriedade do site verificada.' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        {item.status ? (
                          <CheckCircle className="size-5 text-emerald-400 shrink-0" />
                        ) : (
                          <Info className="size-5 text-amber-400 shrink-0" />
                        )}
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-widest">{item.label}</p>
                          <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white border border-slate-100">
                <div className="p-8 border-b border-slate-50">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Otimização (SEO)</h3>
                  <p className="text-slate-500 font-medium text-xs mt-1">Configure as palavras-chave principais para ranqueamento no Google.</p>
                </div>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label htmlFor="seo_main_keyword" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Palavra-Chave Principal</Label>
                      <Input 
                        id="seo_main_keyword" 
                        value={formData.seo_main_keyword} 
                        onChange={(e) => setFormData({ ...formData, seo_main_keyword: e.target.value })} 
                        className="h-14 rounded-2xl" 
                        placeholder="Ex: Leilão de Colecionáveis"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="seo_related_keywords" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Palavras-Chave Relacionadas (Separadas por vírgula)</Label>
                      <Input 
                        id="seo_related_keywords" 
                        value={formData.seo_related_keywords} 
                        onChange={(e) => setFormData({ ...formData, seo_related_keywords: e.target.value })} 
                        className="h-14 rounded-2xl" 
                        placeholder="Ex: hot toys leilão, estátuas premium, bonecos articulados"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label htmlFor="seo_title_template" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Template de Título SEO</Label>
                      <Input 
                        id="seo_title_template" 
                        value={formData.seo_title_template} 
                        onChange={(e) => setFormData({ ...formData, seo_title_template: e.target.value })} 
                        className="h-14 rounded-2xl" 
                        placeholder="Ex: {title} | O Melhor de {keyword}"
                      />
                      <p className="text-[10px] text-slate-400">Use {'{title}'} e {'{keyword}'} como variáveis.</p>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="seo_description_template" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Template de Descrição SEO</Label>
                      <Textarea 
                        id="seo_description_template" 
                        value={formData.seo_description_template} 
                        onChange={(e) => setFormData({ ...formData, seo_description_template: e.target.value })} 
                        className="min-h-[100px] rounded-2xl p-4" 
                        placeholder="Participe dos melhores leilões de {keyword}. Itens exclusivos e segurança total."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white border border-slate-100">
                <div className="p-8 border-b border-slate-50">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Rastreio & Analytics</h3>
                  <p className="text-slate-500 font-medium text-xs mt-1">Conecte ferramentas de análise e pixels de conversão.</p>
                </div>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                      <Label htmlFor="google_analytics_id" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Google Analytics (G-XXXXXX)</Label>
                      <Input 
                        id="google_analytics_id" 
                        value={formData.google_analytics_id} 
                        onChange={(e) => setFormData({ ...formData, google_analytics_id: e.target.value })} 
                        className="h-14 rounded-2xl" 
                        placeholder="G-..."
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="facebook_pixel_id" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Facebook Pixel ID</Label>
                      <Input 
                        id="facebook_pixel_id" 
                        value={formData.facebook_pixel_id} 
                        onChange={(e) => setFormData({ ...formData, facebook_pixel_id: e.target.value })} 
                        className="h-14 rounded-2xl" 
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="google_site_verification" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Google Site Verification</Label>
                      <Input 
                        id="google_site_verification" 
                        value={formData.google_site_verification} 
                        onChange={(e) => setFormData({ ...formData, google_site_verification: e.target.value })} 
                        className="h-14 rounded-2xl" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white border border-slate-100">
                <div className="p-8 border-b border-slate-50">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">URLs & Sitemap</h3>
                  <p className="text-slate-500 font-medium text-xs mt-1">Visualize as URLs amigáveis e o sitemap do seu site.</p>
                </div>
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-tight text-slate-900">Sitemap XML</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Endereço para indexação no Google</p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest"
                      onClick={() => window.open('/sitemap.xml', '_blank')}
                    >
                      Abrir Sitemap
                    </Button>
                  </div>

                  <div className="h-px bg-slate-100 my-2" />

                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-tight text-slate-900">Ferramentas de Validação Google</p>
                    <div className="flex flex-wrap gap-3">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                        onClick={() => window.open(`https://search.google.com/test/rich-results?url=${encodeURIComponent(window.location.origin)}`, '_blank')}
                      >
                        Testar Dados Estruturados
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
                        onClick={() => window.open(`https://search.google.com/search-console/welcome`, '_blank')}
                      >
                        Google Search Console
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100"
                        onClick={() => window.open(`https://pagespeed.web.dev/report?url=${encodeURIComponent(window.location.origin)}`, '_blank')}
                      >
                        PageSpeed Insights
                      </Button>
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium italic">
                      * Nota: Para validar, o site precisa estar publicado e acessível publicamente.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="design" className="space-y-8 mt-0">
            <ThemeEditor />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4">
                <Card className="border-none shadow-2xl shadow-slate-200 overflow-hidden rounded-[2.5rem] bg-slate-900 text-white border border-slate-800 h-full">
                  <CardContent className="p-8 space-y-6 flex flex-col h-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 opacity-60">
                        <MonitorPlay className="w-4 h-4 text-amber-400" />
                        <h3 className="font-black uppercase tracking-[0.2em] text-[9px]">Preview em Tempo Real</h3>
                      </div>
                      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        <Button type="button" variant="ghost" size="icon" className={cn("size-8 rounded-lg", previewDevice === 'mobile' ? "bg-white/10 text-white" : "text-white/40")} onClick={() => setPreviewDevice('mobile')}><Smartphone className="size-4" /></Button>
                        <Button type="button" variant="ghost" size="icon" className={cn("size-8 rounded-lg", previewDevice === 'tablet' ? "bg-white/10 text-white" : "text-white/40")} onClick={() => setPreviewDevice('tablet')}><Tablet className="size-4" /></Button>
                        <Button type="button" variant="ghost" size="icon" className={cn("size-8 rounded-lg", previewDevice === 'desktop' ? "bg-white/10 text-white" : "text-white/40")} onClick={() => setPreviewDevice('desktop')}><Monitor className="size-4" /></Button>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center justify-center relative min-h-[400px]">
                      {/* Device Frame */}
                      <div 
                        className={cn(
                          "transition-all duration-500 border-[8px] border-slate-800 rounded-[3rem] overflow-hidden bg-slate-950 shadow-2xl relative",
                          previewDevice === 'mobile' ? "w-[260px] h-[520px]" : 
                          previewDevice === 'tablet' ? "w-[380px] h-[500px]" : "w-full h-[400px]"
                        )}
                      >
                        {/* Notch for mobile */}
                        {previewDevice === 'mobile' && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20" />
                        )}

                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-6 bg-gradient-to-br from-brand-900 to-black">
                          <p className="text-gold font-black uppercase tracking-[0.3em] text-[8px] animate-pulse">Exemplo de {selectedArea}</p>
                          <h3 
                            style={{ 
                              fontSize: `${(previewDevice === 'mobile' ? 1.2 : 2.2) * ((formData as any)[`${selectedArea}_font_size`] / 100)}rem`,
                              letterSpacing: `${(formData as any)[`${selectedArea}_letter_spacing`] / 100}em`,
                              lineHeight: `${(formData as any)[`${selectedArea}_line_height`] / 100}`,
                              fontFamily: '"Archivo", sans-serif',
                              fontWeight: 900,
                              fontStyle: 'italic',
                              textTransform: 'uppercase',
                              color: 'white'
                            }}
                            className="break-words w-full"
                          >
                            Oportunidade Premium para Colecionadores
                          </h3>
                          <Button 
                            className="rounded-full px-8 py-4 font-black uppercase tracking-widest text-[8px] bg-white text-black hover:bg-slate-200 transition-all"
                            style={{
                              fontSize: `${0.8 * (formData.button_font_size / 100)}rem`,
                              letterSpacing: `${formData.button_letter_spacing / 100}em`
                            }}
                          >
                            Participar Agora
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="lg:col-span-8">
                <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white border border-slate-100">
                  <div className="p-8 border-b border-slate-50">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Tipografia Customizada</h3>
                  </div>
                  <CardContent className="p-8 space-y-10">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'hero', label: 'Destaque (Hero)', icon: Maximize2 },
                        { id: 'section', label: 'Títulos de Seção', icon: Globe },
                        { id: 'card', label: 'Cards de Lote', icon: ImageIcon },
                        { id: 'dashboard', label: 'Painel do Usuário', icon: User },
                        { id: 'button', label: 'Botões', icon: Smartphone },
                      ].map((area) => (
                        <Button
                          key={area.id}
                          type="button"
                          variant={selectedArea === area.id ? 'default' : 'outline'}
                          className={cn("h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px]", selectedArea === area.id && "bg-slate-900")}
                          onClick={() => setSelectedArea(area.id as any)}
                        >
                          <area.icon className="size-4 mr-2" />
                          {area.label}
                        </Button>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Escala (%)</Label>
                        <Slider value={[(formData as any)[`${selectedArea}_font_size`]]} onValueChange={(val) => setFormData({ ...formData, [`${selectedArea}_font_size`]: val[0] })} min={50} max={150} />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Espaçamento</Label>
                        <Slider value={[(formData as any)[`${selectedArea}_letter_spacing`]]} onValueChange={(val) => setFormData({ ...formData, [`${selectedArea}_letter_spacing`]: val[0] })} min={-20} max={20} />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Linha (%)</Label>
                        <Slider value={[(formData as any)[`${selectedArea}_line_height`]]} onValueChange={(val) => setFormData({ ...formData, [`${selectedArea}_line_height`]: val[0] })} min={70} max={150} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="home" className="mt-0">
            <HomeEditor />
          </TabsContent>

          <TabsContent value="pagamentos" className="mt-0">
            <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white border border-slate-100">
              <div className="p-8 border-b border-slate-50">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Gateways de Pagamento</h3>
              </div>
              <CardContent className="p-8 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="size-5 text-sky-500" />
                        <h4 className="font-black uppercase tracking-widest text-sm">Mercado Pago</h4>
                      </div>
                      <Switch checked={formData.enable_mercadopago} onCheckedChange={(val) => setFormData({...formData, enable_mercadopago: val})} />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Public Key</Label>
                      <Input value={formData.mercadopago_public_key} onChange={(e) => setFormData({...formData, mercadopago_public_key: e.target.value})} type="password" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Access Token</Label>
                      <Input value={formData.mercadopago_access_token} onChange={(e) => setFormData({...formData, mercadopago_access_token: e.target.value})} type="password" />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <QrCode className="size-5 text-green-500" />
                        <h4 className="font-black uppercase tracking-widest text-sm">PIX Direto</h4>
                      </div>
                      <Switch checked={formData.enable_pix} onCheckedChange={(val) => setFormData({...formData, enable_pix: val})} />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Chave PIX</Label>
                      <Input value={formData.pix_key} onChange={(e) => setFormData({...formData, pix_key: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">QR Code URL</Label>
                      <Input value={formData.pix_qr_code_url} onChange={(e) => setFormData({...formData, pix_qr_code_url: e.target.value})} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
