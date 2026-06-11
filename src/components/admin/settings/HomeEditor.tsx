
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { GripVertical, Eye, EyeOff, Save, RefreshCw, Settings2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface HomeSection {
  id: string;
  key: string;
  name: string;
  display_order: number;
  is_active: boolean;
  content?: any;
}

interface SortableItemProps {
  section: HomeSection;
  onToggle: (id: string, active: boolean) => void;
  onUpdateContent: (id: string, content: any) => void;
}

function SortableItem({ section, onToggle, onUpdateContent }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [editContent, setEditContent] = useState(section.content || {});

  const handleSaveContent = () => {
    onUpdateContent(section.id, editContent);
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center gap-4 p-4 mb-3 rounded-2xl border ${section.is_active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'} transition-all`}
    >
      <div {...attributes} {...listeners} className="cursor-grab hover:text-primary transition-colors">
        <GripVertical className="size-5 text-slate-400" />
      </div>
      
      <div className="flex-1">
        <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">{section.name}</h4>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{section.key}</p>
      </div>

      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-slate-100">
              <Settings2 className="size-4 text-slate-500" />
            </Button>
          </SheetTrigger>
          <SheetContent className="rounded-l-[2rem] sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="text-2xl font-black uppercase tracking-tight">Configurar {section.name}</SheetTitle>
              <SheetDescription>Ajuste os textos e configurações específicas deste bloco.</SheetDescription>
            </SheetHeader>
            <div className="py-10 space-y-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Título do Bloco</Label>
                <Input 
                  value={editContent.title || ''} 
                  onChange={(e) => setEditContent({ ...editContent, title: e.target.value })}
                  placeholder="Ex: Próximas Oportunidades"
                  className="h-14 rounded-2xl text-slate-900"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subtítulo / Descrição Curta</Label>
                <Textarea 
                  value={editContent.subtitle || ''} 
                  onChange={(e) => setEditContent({ ...editContent, subtitle: e.target.value })}
                  placeholder="Ex: Leilões exclusivos de luxo"
                  className="min-h-[100px] rounded-2xl resize-none text-slate-900"
                />
              </div>
              {section.key === 'cta' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Texto do Botão</Label>
                    <Input 
                      value={editContent.button_text || ''} 
                      onChange={(e) => setEditContent({ ...editContent, button_text: e.target.value })}
                      placeholder="Ex: Criar Conta Agora"
                      className="h-14 rounded-2xl text-slate-900"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Link do Botão</Label>
                    <Input 
                      value={editContent.button_link || ''} 
                      onChange={(e) => setEditContent({ ...editContent, button_link: e.target.value })}
                      placeholder="Ex: /entrar"
                      className="h-14 rounded-2xl text-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>
            <SheetFooter>
              <Button onClick={handleSaveContent} className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">
                <Save className="size-4 mr-2" /> Salvar Configurações do Bloco
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Switch 
          checked={section.is_active} 
          onCheckedChange={(checked) => onToggle(section.id, checked)}
        />
      </div>
    </div>
  );
}

export function HomeEditor() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchSections = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('home_sections')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      toast.error('Erro ao carregar seções: ' + error.message);
    } else {
      setSections(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleToggle = (id: string, active: boolean) => {
    setSections(items => items.map(i => i.id === id ? { ...i, is_active: active } : i));
  };

  const handleUpdateContent = (id: string, content: any) => {
    setSections(items => items.map(i => i.id === id ? { ...i, content } : i));
    toast.info('Alteração de conteúdo preparada. Não esqueça de salvar o layout!');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = sections.map((section, index) => ({
        id: section.id,
        key: section.key,
        name: section.name,
        display_order: index + 1,
        is_active: section.is_active,
        content: section.content,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('home_sections')
        .upsert(updates);

      if (error) throw error;
      toast.success('Organização da home salva com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center">
        <RefreshCw className="size-10 text-primary animate-spin mx-auto mb-4" />
        <p className="text-sm font-black uppercase text-slate-400">Sincronizando seções...</p>
      </div>
    );
  }

  return (
    <Card className="light border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white border border-slate-100 overflow-hidden">
      <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Editor da Home Page</CardTitle>
          <CardDescription className="text-sm font-medium mt-1">Arraste para reordenar os blocos e use as chaves para ativar/desativar cada seção.</CardDescription>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-slate-200"
        >
          {saving ? <RefreshCw className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
          Salvar Layout
        </Button>
      </CardHeader>
      <CardContent className="p-8">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={sections.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="max-w-2xl mx-auto">
              {sections.map((section) => (
                <SortableItem 
                  key={section.id} 
                  section={section} 
                  onToggle={handleToggle} 
                  onUpdateContent={handleUpdateContent}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}
