
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, Palette, RefreshCw, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  foreground: string;
  gold: string;
  brand_500: string;
  brand_600: string;
  brand_950: string;
}

const defaultTheme: ThemeConfig = {
  primary: '#0b0d14',
  secondary: '#1c1e26',
  accent: '#d4af37',
  background: '#0b0d14',
  surface: '#12141c',
  foreground: '#f8fafc',
  gold: '#d4af37',
  brand_500: '#1e293b',
  brand_600: '#0f172a',
  brand_950: '#020617',
};

const themePresets: { name: string; colors: ThemeConfig }[] = [
  {
    name: 'Original Premium',
    colors: {
      primary: '#0b0d14',
      secondary: '#1c1e26',
      accent: '#d4af37',
      background: '#0b0d14',
      surface: '#12141c',
      foreground: '#f8fafc',
      gold: '#d4af37',
      brand_500: '#1e293b',
      brand_600: '#0f172a',
      brand_950: '#020617',
    }
  },
  {
    name: 'Modern Slate',
    colors: {
      primary: '#0f172a',
      secondary: '#1e293b',
      accent: '#38bdf8',
      background: '#0f172a',
      surface: '#1e293b',
      foreground: '#f1f5f9',
      gold: '#7dd3fc',
      brand_500: '#334155',
      brand_600: '#475569',
      brand_950: '#020617',
    }
  },
  {
    name: 'Deep Forest',
    colors: {
      primary: '#064e3b',
      secondary: '#065f46',
      accent: '#10b981',
      background: '#022c22',
      surface: '#064e3b',
      foreground: '#ecfdf5',
      gold: '#34d399',
      brand_500: '#059669',
      brand_600: '#047857',
      brand_950: '#064e3b',
    }
  },
  {
    name: 'Royal Velvet',
    colors: {
      primary: '#4c1d95',
      secondary: '#5b21b6',
      accent: '#a78bfa',
      background: '#2e1065',
      surface: '#4c1d95',
      foreground: '#f5f3ff',
      gold: '#ddd6fe',
      brand_500: '#7c3aed',
      brand_600: '#8b5cf6',
      brand_950: '#4c1d95',
    }
  },
  {
    name: 'Sunset Glow',
    colors: {
      primary: '#7c2d12',
      secondary: '#9a3412',
      accent: '#fb923c',
      background: '#431407',
      surface: '#7c2d12',
      foreground: '#fff7ed',
      gold: '#fdba74',
      brand_500: '#ea580c',
      brand_600: '#f97316',
      brand_950: '#7c2d12',
    }
  },
  {
    name: 'Midnight Gold',
    colors: {
      primary: '#171717',
      secondary: '#262626',
      accent: '#fbbf24',
      background: '#0a0a0a',
      surface: '#171717',
      foreground: '#fafafa',
      gold: '#f59e0b',
      brand_500: '#404040',
      brand_600: '#525252',
      brand_950: '#171717',
    }
  },
  {
    name: 'Bordeaux Reserve',
    colors: {
      primary: '#450a0a',
      secondary: '#7f1d1d',
      accent: '#f87171',
      background: '#450a0a',
      surface: '#7f1d1d',
      foreground: '#fef2f2',
      gold: '#fca5a5',
      brand_500: '#991b1b',
      brand_600: '#b91c1c',
      brand_950: '#450a0a',
    }
  },
  {
    name: 'Ocean Depth',
    colors: {
      primary: '#082f49',
      secondary: '#075985',
      accent: '#38bdf8',
      background: '#0c4a6e',
      surface: '#082f49',
      foreground: '#f0f9ff',
      gold: '#7dd3fc',
      brand_500: '#0284c7',
      brand_600: '#0369a1',
      brand_950: '#082f49',
    }
  },
  {
    name: 'Cyber Punk',
    colors: {
      primary: '#2d005d',
      secondary: '#4b0082',
      accent: '#00ffcc',
      background: '#1a0033',
      surface: '#2d005d',
      foreground: '#f0f0f0',
      gold: '#ff00ff',
      brand_500: '#8a2be2',
      brand_600: '#9400d3',
      brand_950: '#2d005d',
    }
  },
  {
    name: 'Industrial Silver',
    colors: {
      primary: '#1e293b',
      secondary: '#334155',
      accent: '#94a3b8',
      background: '#0f172a',
      surface: '#1e293b',
      foreground: '#f8fafc',
      gold: '#cbd5e1',
      brand_500: '#64748b',
      brand_600: '#94a3b8',
      brand_950: '#020617',
    }
  },
  {
    name: 'Pure White',
    colors: {
      primary: '#f8fafc',
      secondary: '#f1f5f9',
      accent: '#3b82f6',
      background: '#ffffff',
      surface: '#f8fafc',
      foreground: '#0f172a',
      gold: '#60a5fa',
      brand_500: '#94a3b8',
      brand_600: '#cbd5e1',
      brand_950: '#f8fafc',
    }
  }
];

export function ThemeEditor() {
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchTheme = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'site_config')
        .single();

      if (data?.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
        const config = data.value as any;
        if (config.theme) {
          setTheme({ ...defaultTheme, ...config.theme });
        }
      }
      setLoading(false);
    };
    fetchTheme();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'site_config')
        .single();

      const existingConfig = (existing?.value && typeof existing.value === 'object' && !Array.isArray(existing.value)) 
        ? (existing.value as any) 
        : {};

      const newConfig = {
        ...existingConfig,
        theme: theme
      };

      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
          key: 'site_config', 
          value: newConfig,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Paleta de cores atualizada!');
    } catch (error: any) {
      toast.error('Erro ao salvar tema: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateColor = (key: keyof ThemeConfig, value: string) => {
    setTheme(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return (
    <div className="p-20 text-center">
      <RefreshCw className="size-10 text-primary animate-spin mx-auto mb-4" />
      <p className="text-sm font-black uppercase text-slate-400">Carregando paleta...</p>
    </div>
  );

  return (
    <Card className="light border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white border border-slate-100 overflow-hidden">
      <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Paleta de Cores</CardTitle>
          <CardDescription className="text-sm font-medium mt-1">Personalize as cores principais da plataforma e do painel.</CardDescription>
        </div>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={() => setTheme(defaultTheme)}
            className="rounded-2xl h-12 px-6 font-black uppercase tracking-widest text-[10px] border-slate-200"
          >
            <RotateCcw className="size-4 mr-2" /> Resetar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-slate-200"
          >
            {saving ? <RefreshCw className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
            Salvar Cores
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-12">
        {/* Presets Section */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
            <Palette className="size-4" /> Presets de Paleta
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {themePresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setTheme(preset.colors)}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all text-left hover:scale-[1.02] active:scale-[0.98]",
                  JSON.stringify(theme) === JSON.stringify(preset.colors) 
                    ? "border-primary bg-primary/5 shadow-lg" 
                    : "border-slate-100 bg-white hover:border-slate-200"
                )}
              >
                <div className="flex gap-1 mb-3">
                  <div style={{ backgroundColor: preset.colors.primary }} className="size-4 rounded-full border border-black/10" />
                  <div style={{ backgroundColor: preset.colors.accent }} className="size-4 rounded-full border border-black/10" />
                  <div style={{ backgroundColor: preset.colors.surface }} className="size-4 rounded-full border border-black/10" />
                  <div style={{ backgroundColor: preset.colors.gold }} className="size-4 rounded-full border border-black/10" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-tight text-slate-900">{preset.name}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8 border-t border-slate-50">
          {/* Main Colors */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <Palette className="size-4" /> Cores Principais
            </h3>
            
            <ColorInput label="Cor Primária" value={theme.primary} onChange={(val) => updateColor('primary', val)} />
            <ColorInput label="Cor de Destaque (Accent)" value={theme.accent} onChange={(val) => updateColor('accent', val)} />
            <ColorInput label="Cor Ouro (Geral)" value={theme.gold} onChange={(val) => updateColor('gold', val)} />
          </div>

          {/* Backgrounds */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <Palette className="size-4" /> Fundos e Superfícies
            </h3>
            
            <ColorInput label="Fundo da Página" value={theme.background} onChange={(val) => updateColor('background', val)} />
            <ColorInput label="Fundo de Cards (Surface)" value={theme.surface} onChange={(val) => updateColor('surface', val)} />
            <ColorInput label="Cor do Texto (Foreground)" value={theme.foreground} onChange={(val) => updateColor('foreground', val)} />
          </div>

          {/* Brand/Scale */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <Palette className="size-4" /> Escala de Marca
            </h3>
            
            <ColorInput label="Brand 500" value={theme.brand_500} onChange={(val) => updateColor('brand_500', val)} />
            <ColorInput label="Brand 600" value={theme.brand_600} onChange={(val) => updateColor('brand_600', val)} />
            <ColorInput label="Brand 950 (Darkest)" value={theme.brand_950} onChange={(val) => updateColor('brand_950', val)} />
          </div>
        </div>

        {/* Preview Section */}
        <div className="mt-12 p-8 rounded-[3rem] border border-slate-100 bg-slate-50">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 text-center">Prévia de Contraste</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div style={{ backgroundColor: theme.primary, color: theme.foreground }} className="p-6 rounded-2xl shadow-sm text-center">
              <span className="text-xs font-black uppercase tracking-widest">Primária</span>
            </div>
            <div style={{ backgroundColor: theme.accent, color: 'black' }} className="p-6 rounded-2xl shadow-sm text-center">
              <span className="text-xs font-black uppercase tracking-widest">Destaque</span>
            </div>
            <div style={{ backgroundColor: theme.surface, color: theme.foreground }} className="p-6 rounded-2xl border border-white/5 shadow-sm text-center">
              <span className="text-xs font-black uppercase tracking-widest">Superfície</span>
            </div>
            <div style={{ backgroundColor: theme.gold, color: 'black' }} className="p-6 rounded-2xl shadow-sm text-center">
              <span className="text-xs font-black uppercase tracking-widest">Ouro</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ColorInput({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</Label>
      <div className="flex gap-3">
        <input 
          type="color" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="size-12 rounded-xl border-none cursor-pointer overflow-hidden bg-transparent"
        />
        <div className="flex-1 relative">
          <input 
            type="text" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 font-mono text-sm uppercase font-bold text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
      </div>
    </div>
  );
}
