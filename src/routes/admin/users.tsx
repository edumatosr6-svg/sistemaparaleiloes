import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert,
  Download,
  Mail,
  Smartphone,
  ShieldCheck,
  Users,
  Clock,
  Edit,
  Trash2,
  Save,
  X,
  UserCheck,
  UserX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const Route = createFileRoute('/admin/users')({
  component: UsersPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      status: (search.status as string) || undefined,
    }
  },
});

interface UserProfile {
  id: string;
  full_name: string | null;
  cpf_cnpj: string | null;
  role: 'admin' | 'operator' | 'user';
  is_approved: boolean;
  is_blocked: boolean;
  caucao_balance: number;
  phone: string | null;
  created_at: string;
}

function UsersPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { status: statusFilter } = Route.useSearch();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          profiles_private (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const formattedData = (data as any[]).map(item => ({
        ...item,
        cpf_cnpj: item.profiles_private?.cpf_cnpj || null,
        caucao_balance: item.profiles_private?.caucao_balance || 0,
        phone: item.profiles_private?.phone || null,
      }));
      setUsers(formattedData as UserProfile[]);
    } catch (error: any) {
      toast.error("Erro ao buscar usuários: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user: UserProfile) => {
    setEditingUser({ ...user });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editingUser.full_name,
          role: editingUser.role,
          is_approved: editingUser.is_approved,
          is_blocked: editingUser.is_blocked,
        })
        .eq('id', editingUser.id);

      if (profileError) throw profileError;

      const { error: privateError } = await supabase
        .from('profiles_private')
        .update({
          cpf_cnpj: editingUser.cpf_cnpj,
          caucao_balance: editingUser.caucao_balance,
          phone: editingUser.phone,
        })
        .eq('id', editingUser.id);

      if (privateError) throw privateError;

      toast.success("Usuário atualizado com sucesso.");
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error("Erro ao atualizar usuário: " + error.message);
    }
  };

  const toggleStatus = async (user: UserProfile, field: 'is_approved' | 'is_blocked') => {
    try {
      const updateData: any = { [field]: !user[field] };
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast.success(`Status ${field === 'is_approved' ? 'de aprovação' : 'de bloqueio'} atualizado.`);
      fetchUsers();
    } catch (error: any) {
      toast.error("Erro ao atualizar status: " + error.message);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.cpf_cnpj?.includes(searchTerm) ||
      user.id.includes(searchTerm);
    
    let matchesStatus = true;
    if (statusFilter === 'approved') matchesStatus = user.is_approved && !user.is_blocked;
    else if (statusFilter === 'pending') matchesStatus = !user.is_approved && !user.is_blocked;
    else if (statusFilter === 'blocked') matchesStatus = user.is_blocked;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: users.length,
    pending: users.filter(u => !u.is_approved).length,
    blocked: users.filter(u => u.is_blocked).length,
    totalCaucao: users.reduce((acc, u) => acc + (u.caucao_balance || 0), 0)
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Buscar por nome, CPF/CNPJ..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select 
                value={statusFilter || 'all'} 
                onValueChange={(val) => {
                  navigate({
                    search: {
                      status: val === 'all' ? undefined : val
                    }
                  } as any);
                }}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="approved">Aprovados</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="blocked">Bloqueados</SelectItem>
                </SelectContent>
              </Select>
              
              {statusFilter && (
                <Link to="/admin/users">
                  <Button variant="outline" size="icon" title="Limpar filtros">
                    <XCircle className="w-4 h-4 text-red-500" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchUsers()}>
              Atualizar Dados
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" /> Exportar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-blue-50/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-amber-50/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pendentes</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-red-50/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg text-red-600">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Bloqueados</p>
                <p className="text-2xl font-bold">{stats.blocked}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-green-50/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg text-green-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Caução Total</p>
                <p className="text-2xl font-bold">R$ {stats.totalCaucao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Caução</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-gray-500">Carregando usuários...</TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-gray-500">Nenhum usuário encontrado.</TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-xs">
                            {user.full_name ? user.full_name.split(' ').map(n => n[0]).join('') : 'U'}
                          </div>
                          <div>
                            <p className="font-medium">{user.full_name || 'Usuário sem nome'}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{user.id.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{user.cpf_cnpj || '---'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "text-[10px] uppercase font-bold",
                          user.role === 'operator' ? "border-purple-200 text-purple-700 bg-purple-50" : 
                          user.role === 'admin' ? "border-red-200 text-red-700 bg-red-50" : "border-gray-200 text-gray-600"
                        )}>
                          {user.role === 'admin' ? 'Admin' : user.role === 'operator' ? 'Operador' : 'Usuário'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-blue-600">
                        R$ {(user.caucao_balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            user.is_blocked ? "bg-red-500" : 
                            user.is_approved ? "bg-green-500" : "bg-amber-500"
                          )} />
                          <span className="text-xs">
                            {user.is_blocked ? 'Bloqueado' : user.is_approved ? 'Aprovado' : 'Pendente'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => handleEdit(user)}>
                            <Edit className="w-4 h-4 text-blue-500" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="w-8 h-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Ações Rápidas</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => toggleStatus(user, 'is_approved')}>
                                <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> 
                                {user.is_approved ? 'Desaprovar' : 'Aprovar'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleStatus(user, 'is_blocked')}>
                                <UserX className="w-4 h-4 mr-2 text-red-500" /> 
                                {user.is_blocked ? 'Desbloquear' : 'Bloquear'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Mail className="w-4 h-4 mr-2" /> Enviar Mensagem
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            {editingUser && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Nome</Label>
                  <Input 
                    id="name" 
                    value={editingUser.full_name || ''} 
                    className="col-span-3" 
                    onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="document" className="text-right">CPF/CNPJ</Label>
                  <Input 
                    id="document" 
                    value={editingUser.cpf_cnpj || ''} 
                    className="col-span-3" 
                    onChange={(e) => setEditingUser({...editingUser, cpf_cnpj: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">Telefone</Label>
                  <Input 
                    id="phone" 
                    value={editingUser.phone || ''} 
                    className="col-span-3" 
                    onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="balance" className="text-right">Saldo Caução</Label>
                  <Input 
                    id="balance" 
                    type="number"
                    value={editingUser.caucao_balance || 0} 
                    className="col-span-3" 
                    onChange={(e) => setEditingUser({...editingUser, caucao_balance: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">Cargo</Label>
                  <Select 
                    value={editingUser.role} 
                    onValueChange={(value: any) => setEditingUser({...editingUser, role: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="operator">Operador</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Status</Label>
                  <div className="col-span-3 flex gap-4">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={editingUser.is_approved} 
                        onChange={(e) => setEditingUser({...editingUser, is_approved: e.target.checked})}
                        id="check-approved"
                      />
                      <Label htmlFor="check-approved">Aprovado</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={editingUser.is_blocked} 
                        onChange={(e) => setEditingUser({...editingUser, is_blocked: e.target.checked})}
                        id="check-blocked"
                      />
                      <Label htmlFor="check-blocked" className="text-red-500">Bloqueado</Label>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}