import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, MapPin, Building2, ShieldCheck, Loader2 } from "lucide-react";
import { SkeletonPremium } from "@/components/ui/skeleton-premium";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function ProfileSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    cpf_cnpj: "",
    address: "",
  });

  const { data: profile, isLoading: isFetching } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*, profiles_private(*)")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      
      const profileData = data as any;
      return {
        ...profileData,
        phone: profileData.profiles_private?.phone || "",
        cpf_cnpj: profileData.profiles_private?.cpf_cnpj || "",
        address: profileData.profiles_private?.address || "",
      };
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: user?.email || "",
        phone: (profile as any).phone || "",
        cpf_cnpj: profile.cpf_cnpj || "",
        address: (profile as any).address || "",
      });
    }
  }, [profile, user]);

  const updateMutation = useMutation({
    mutationFn: async (newData: typeof formData) => {
      if (!user) throw new Error("Não autenticado");
      const { email, ...profileData } = newData;
      
      const { error: pError } = await supabase
        .from("profiles")
        .update({
          full_name: profileData.full_name,
        })
        .eq("id", user.id);
      
      if (pError) throw pError;

      const { error: privError } = await supabase
        .from("profiles_private")
        .update({
          phone: profileData.phone,
          cpf_cnpj: profileData.cpf_cnpj,
          address: profileData.address,
        })
        .eq("id", user.id);
      
      if (privError) throw privError;
      
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar perfil: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isFetching) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <SkeletonPremium className="h-10 w-48" />
          <SkeletonPremium className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonPremium className="lg:col-span-2 h-[400px] w-full" />
          <SkeletonPremium className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">Meu Perfil</h1>
          <p className="text-sm text-gray-400 font-medium">Gerencie suas informações pessoais e de segurança.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20">
          <ShieldCheck className="w-3 h-3" />
          Conta Ativa
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-brand-800 bg-brand-900 shadow-xl rounded-3xl overflow-hidden border-2">
          <CardHeader className="border-b border-brand-800 pb-4">
            <CardTitle className="text-xl font-black text-white italic uppercase tracking-tight">Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
                    <Input 
                      id="full_name" 
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="pl-10 bg-brand-800 border-brand-700 text-white h-12 rounded-xl focus:border-gold transition-colors" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
                    <Input 
                      id="email" 
                      type="email" 
                      value={formData.email}
                      disabled
                      className="pl-10 bg-brand-800/50 border-brand-700/50 text-gray-400 h-12 rounded-xl cursor-not-allowed" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
                    <Input 
                      id="phone" 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-10 bg-brand-800 border-brand-700 text-white h-12 rounded-xl focus:border-gold transition-colors" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">CPF / CNPJ</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
                    <Input 
                      id="cpf" 
                      value={formData.cpf_cnpj}
                      onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                      className="pl-10 bg-brand-800 border-brand-700 text-white h-12 rounded-xl focus:border-gold transition-colors" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Endereço Completo</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
                  <Input 
                    id="address" 
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="pl-10 bg-brand-800 border-brand-700 text-white h-12 rounded-xl focus:border-gold transition-colors" 
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" className="h-12 px-8 bg-gold text-black hover:bg-gold-light rounded-xl font-black uppercase tracking-widest shadow-glow-gold transition-all" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-brand-800 bg-brand-900 shadow-xl rounded-3xl overflow-hidden border-2">
          <CardHeader className="border-b border-brand-800 pb-4">
            <CardTitle className="text-xl font-black text-white italic uppercase tracking-tight">Segurança</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="p-6 rounded-2xl border border-brand-800 bg-brand-800/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-white uppercase tracking-tight italic">Autenticação 2FA</span>
                <span className="text-[10px] px-3 py-1 bg-green-500/10 text-green-500 rounded-full font-black uppercase tracking-widest border border-green-500/20">Disponível</span>
              </div>
              <p className="text-xs text-gray-400 font-medium">Aumente a segurança da sua conta com a verificação em duas etapas.</p>
              <Button variant="outline" size="sm" className="w-full h-10 border-brand-700 text-white hover:bg-gold hover:text-black hover:border-gold font-bold transition-all">Configurar 2FA</Button>
            </div>

            <div className="p-6 rounded-2xl border border-brand-800 bg-brand-800/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-white uppercase tracking-tight italic">Senha de Acesso</span>
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Proteção ativa</span>
              </div>
              <Button variant="outline" size="sm" className="w-full h-10 border-brand-700 text-white hover:bg-gold hover:text-black hover:border-gold font-bold transition-all" onClick={() => toast.info("Funcionalidade em desenvolvimento")}>Alterar Senha</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
