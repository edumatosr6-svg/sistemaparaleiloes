import { createFileRoute } from '@tanstack/react-router';
import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Search, 
  Plus, 
  Tags, 
  Edit3, 
  Trash2,
  Save,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
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

export const Route = createFileRoute('/admin/categories')({
  component: CategoriesManagementPage,
});

function CategoriesManagementPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    display_order: 0,
    icon: '',
    image_url: ''
  });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newCategory: any) => {
      const { data, error } = await supabase
        .from('categories')
        .insert([newCategory])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Categoria criada com sucesso');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Erro ao criar categoria: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedCategory: any) => {
      const { data, error } = await supabase
        .from('categories')
        .update(updatedCategory)
        .eq('id', editingCategory.id)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Categoria atualizada com sucesso');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar categoria: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Categoria excluída com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir categoria: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      display_order: 0,
      icon: '',
      image_url: ''
    });
    setEditingCategory(null);
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      display_order: category.display_order || 0,
      icon: category.icon || '',
      image_url: category.image_url || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredCategories = categories?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Buscar categoria..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" /> Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Criar Nova Categoria'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-4">
                  <ImageUpload 
                    label="Imagem da Categoria"
                    value={formData.image_url}
                    onChange={(url) => setFormData({...formData, image_url: url})}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="cat-name">Nome da Categoria</Label>
                    <Input 
                      id="cat-name" 
                      value={formData.name} 
                      onChange={(e) => {
                        const name = e.target.value;
                        const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
                        setFormData({...formData, name, slug});
                      }}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cat-slug">Slug (URL)</Label>
                    <Input id="cat-slug" value={formData.slug} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cat-order">Ordem de Exibição</Label>
                    <Input 
                      id="cat-order" 
                      type="number" 
                      value={formData.display_order} 
                      onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                      required 
                    />
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingCategory ? 'Salvar' : 'Criar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-50 animate-pulse rounded" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Ordem</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories?.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-bold text-gray-400">{cat.display_order}</TableCell>
                      <TableCell className="font-semibold">{cat.name}</TableCell>
                      <TableCell className="text-xs text-gray-500">{cat.slug}</TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)}>
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => {
                          if (confirm('Deseja excluir esta categoria?')) deleteMutation.mutate(cat.id);
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
