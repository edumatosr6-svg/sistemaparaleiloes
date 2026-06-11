import { createFileRoute } from '@tanstack/react-router';
import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Search, 
  Plus, 
  Image as ImageIcon, 
  Edit3, 
  Trash2, 
  Save, 
  X,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/admin/ImageUpload';


export const Route = createFileRoute('/admin/banners')({
  component: BannersManagementPage,
});

function BannersManagementPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_url: '',
    display_order: 0,
    is_active: true
  });

  const { data: banners, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newBanner: any) => {
      const { data, error } = await supabase
        .from('banners')
        .insert([newBanner])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['home-banners'] });
      toast.success('Banner criado com sucesso');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Erro ao criar banner: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedBanner: any) => {
      const { data, error } = await supabase
        .from('banners')
        .update(updatedBanner)
        .eq('id', editingBanner.id)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['home-banners'] });
      toast.success('Banner atualizado com sucesso');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar banner: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['home-banners'] });
      toast.success('Banner excluído com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir banner: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      image_url: '',
      link_url: '',
      display_order: 0,
      is_active: true
    });
    setEditingBanner(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBanner) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (banner: any) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      display_order: banner.display_order || 0,
      is_active: banner.is_active ?? true
    });
    setIsDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Gerenciar Slides (Banners)</h2>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" /> Novo Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px]">
              <DialogHeader>
                <DialogTitle>{editingBanner ? 'Editar Banner' : 'Criar Novo Banner'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Form Column */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título do Banner</Label>
                      <Input 
                        id="title" 
                        placeholder="Ex: Coleção Marvel 2026" 
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                      />
                    </div>
                    
                    <ImageUpload 
                      label="Imagem do Banner"
                      value={formData.image_url}
                      onChange={(url) => setFormData({...formData, image_url: url})}
                    />

                    <div className="space-y-2">
                      <Label htmlFor="link_url">URL de Destino (Link)</Label>
                      <Input 
                        id="link_url" 
                        placeholder="https://seusite.com/leilao/123" 
                        value={formData.link_url}
                        onChange={(e) => setFormData({...formData, link_url: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="order">Ordem de Exibição</Label>
                        <Input 
                          id="order" 
                          type="number"
                          value={formData.display_order}
                          onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-8">
                        <Switch 
                          id="active" 
                          checked={formData.is_active}
                          onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                        />
                        <Label htmlFor="active">Ativo</Label>
                      </div>
                    </div>
                  </div>

                  {/* Preview Column */}
                  <div className="space-y-4">
                    <Label className="text-xs uppercase tracking-widest text-gray-400 font-black">Preview em Tempo Real</Label>
                    <div className="relative aspect-video rounded-3xl overflow-hidden bg-black border border-gray-100 shadow-2xl group">
                      {formData.image_url ? (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent z-10" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                          <img src={formData.image_url} className="w-full h-full object-cover" alt="Preview" />
                          <div className="absolute inset-0 z-20 p-8 flex flex-col justify-center">
                            <span className="bg-primary text-white text-[8px] font-black px-3 py-1 rounded-full w-fit mb-3 tracking-widest">DESTAQUE</span>
                            <h3 className="text-white font-black text-3xl leading-[0.9] tracking-tighter line-clamp-2 max-w-[80%] uppercase">
                              {formData.title || 'Título do seu leilão'}
                            </h3>
                            <Button size="sm" className="mt-6 w-fit bg-white text-black hover:bg-gray-100 rounded-full text-[10px] font-black h-10 px-6 tracking-widest uppercase">
                              Participar agora
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-3 bg-gray-50/50">
                          <ImageIcon className="w-10 h-10 opacity-20" />
                          <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-40">Aguardando imagem para o preview</p>
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                      <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Dica de Design</p>
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        Use imagens com resolução mínima de 1920x1080. O sistema aplica automaticamente um gradiente escuro à esquerda para garantir que o título seja legível.
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingBanner ? 'Salvar Alterações' : 'Criar Banner'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : banners?.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-100">
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum banner cadastrado ainda.</p>
            <Button variant="link" onClick={() => setIsDialogOpen(true)}>Criar meu primeiro banner</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners?.map((banner) => (
              <Card key={banner.id} className="overflow-hidden border-none shadow-sm group rounded-2xl">
                <div className="relative aspect-video overflow-hidden">
                  <img src={banner.image_url} alt={banner.title || ''} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(banner)}>
                      <Edit3 className="w-4 h-4 mr-2" /> Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => {
                      if (confirm('Deseja excluir este banner?')) deleteMutation.mutate(banner.id);
                    }}>
                      <Trash2 className="w-4 h-4 mr-2" /> Excluir
                    </Button>
                  </div>
                  <div className="absolute top-3 left-3 flex gap-2">
                    {banner.is_active ? (
                      <Badge className="bg-green-500 border-none"><Eye className="w-3 h-3 mr-1" /> Ativo</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-500 text-white border-none"><EyeOff className="w-3 h-3 mr-1" /> Inativo</Badge>
                    )}
                    <Badge variant="outline" className="bg-white/80 border-none">Ordem: {banner.display_order}</Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-gray-900 line-clamp-1">{banner.title || 'Sem Título'}</h3>
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <ExternalLink className="w-3 h-3 mr-2" />
                    <span className="line-clamp-1">{banner.link_url || 'Nenhum link'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
