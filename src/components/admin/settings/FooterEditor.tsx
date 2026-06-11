
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Shield, CreditCard, CheckCircle2, Lock, Globe, Send, Play } from 'lucide-react';

interface FooterEditorProps {
  formData: any;
  setFormData: (data: any) => void;
}

export function FooterEditor({ formData, setFormData }: FooterEditorProps) {
  return (
    <div className="space-y-8">
      <Card className="light border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white border border-slate-100">
        <CardHeader className="p-8 border-b border-slate-50">
          <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Redes Sociais</CardTitle>
          <CardDescription className="text-sm font-medium mt-1">Configure os links para as redes sociais exibidas no rodapé.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Instagram URL</Label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  value={formData.instagram_url} 
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })} 
                  className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-200 text-slate-900 font-bold focus:bg-white transition-all shadow-sm ring-1 ring-slate-100" 

                  placeholder="https://instagram.com/seuusuario" 
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Facebook URL</Label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  value={formData.facebook_url} 
                  onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })} 
                  className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-200 text-slate-900 font-bold focus:bg-white transition-all shadow-sm ring-1 ring-slate-100" 

                  placeholder="https://facebook.com/suapagina" 
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Twitter URL</Label>
              <div className="relative">
                <Send className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  value={formData.twitter_url} 
                  onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })} 
                  className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-200 text-slate-900 font-bold focus:bg-white transition-all shadow-sm ring-1 ring-slate-100" 

                  placeholder="https://twitter.com/seuusuario" 
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">YouTube URL</Label>
              <div className="relative">
                <Play className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  value={formData.youtube_url} 
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })} 
                  className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-200 text-slate-900 font-bold focus:bg-white transition-all shadow-sm ring-1 ring-slate-100" 
                  placeholder="https://youtube.com/seucanal" 
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="light border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white border border-slate-100">
        <CardHeader className="p-8 border-b border-slate-50">
          <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Selos de Segurança e Pagamento</CardTitle>
          <CardDescription className="text-sm font-medium mt-1">Configure os selos e banners que aparecem no rodapé do site.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="size-4 text-green-500" />
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Selo Google Safe</Label>
              </div>
              <ImageUpload 
                value={formData.google_safe_url}
                onChange={(url) => setFormData({ ...formData, google_safe_url: url })}
                bucket="site-assets"
              />
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Selo de segurança exibido no canto inferior esquerdo.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="size-4 text-blue-500" />
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Banner Mercado Pago</Label>
              </div>
              <ImageUpload 
                value={formData.mercado_pago_banner_url}
                onChange={(url) => setFormData({ ...formData, mercado_pago_banner_url: url })}
                bucket="site-assets"
              />
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Banner de pagamento seguro do Mercado Pago.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Banner PIX</Label>
              </div>
              <ImageUpload 
                value={formData.pix_banner_url}
                onChange={(url) => setFormData({ ...formData, pix_banner_url: url })}
                bucket="site-assets"
              />
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Logomarca ou selo do PIX para o rodapé.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="size-4 text-amber-500" />
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Selo Auditado / Seguro</Label>
              </div>
              <ImageUpload 
                value={formData.security_seal_url}
                onChange={(url) => setFormData({ ...formData, security_seal_url: url })}
                bucket="site-assets"
              />
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Selo de site auditado ou segurança 256-bit.</p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-50">
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="size-4 text-slate-400" />
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bandeiras de Cartão de Crédito</Label>
            </div>
            <ImageUpload 
              value={formData.cards_banner_url}
              onChange={(url) => setFormData({ ...formData, cards_banner_url: url })}
              bucket="site-assets"
            />
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-4">Banner horizontal com as bandeiras dos cartões aceitos.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
