import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { SmartImage } from '../SmartImage';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, Building2, Smartphone, Mail, MapPin, Lock, FileText, Hash } from 'lucide-react';

export function AuthForm() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [personType, setPersonType] = useState<'PF' | 'PJ'>('PF');
  const navigate = useNavigate();
  const search = useSearch({ from: '/entrar' }) as any;
  const [refCode, setRefCode] = useState<string | null>(null);

  const [registrationData, setRegistrationData] = useState({
    full_name: '',
    corporate_name: '',
    trade_name: '',
    document: '',
    phone: '',
    whatsapp: '',
    cep: '',
    address: '',
    address_number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  const { data: siteConfig } = useQuery({
    queryKey: ['site-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'site_config')
        .maybeSingle();
      
      if (error) throw error;
      return data?.value as any;
    },
    staleTime: 0 // Garante que as informações do site (logo, nome) estejam sempre atualizadas
  });

  useEffect(() => {
    if (search.ref) {
      setRefCode(search.ref);
    }
  }, [search.ref]);

  const formatDocument = (value: string, type: 'PF' | 'PJ') => {
    const cleanValue = value.replace(/\D/g, '');
    if (type === 'PF') {
      return cleanValue
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    } else {
      return cleanValue
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    }
  };

  const formatPhone = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    setRegistrationData(prev => ({ ...prev, cep: cleanCep }));
    
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setRegistrationData(prev => ({
            ...prev,
            address: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf
          }));
          toast.success('Endereço preenchido automaticamente!');
        }
      } catch (error) {
        console.error('Error fetching CEP:', error);
      }
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos.');
      return;
    }

    if (isSignUp) {
      const isPF = personType === 'PF';
      const hasName = isPF ? registrationData.full_name : registrationData.corporate_name;
      if (!hasName || !registrationData.phone || !registrationData.cep || !registrationData.document) {
        toast.error('Por favor, preencha todos os dados obrigatórios.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              ...registrationData,
              person_type: personType,
              referred_by: refCode,
            }
          }
        });
        if (error) throw error;
        toast.success('Cadastro realizado com sucesso! Você já pode entrar.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Bem-vindo de volta!');
        
        const { data: userResponse } = await supabase.auth.getUser();
        const user = userResponse.user;
        if (!user) throw new Error("Usuário não encontrado");
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile?.role === 'admin') {
          (navigate as any)({ to: '/admin' });
        } else {
          (navigate as any)({ to: '/painel' });
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || 'Erro ao processar autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`light w-full ${isSignUp ? 'max-w-2xl' : 'max-w-md'} mx-auto border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[2.5rem] bg-white transition-all duration-500`}>
      <CardHeader className="text-center pt-10 pb-6 px-6 md:px-10">
        <div className="flex justify-center mb-8">
          {siteConfig?.logo_url ? (
            <SmartImage 
              src={siteConfig.logo_url} 
              alt={siteConfig.name} 
              className="h-20 w-auto object-contain transition-transform duration-300 hover:scale-105"
            />
          ) : siteConfig?.name ? (
             <div className="flex items-center gap-2 group">
                <span className="bg-slate-900 text-white size-12 rounded-2xl flex items-center justify-center font-black shadow-xl text-xl leading-none rotate-3 group-hover:rotate-0 transition-transform">
                  <span className="relative" style={{ top: '-0.5px' }}>{siteConfig.name.charAt(0)}</span>
                </span>
                <div className="flex flex-col items-start">
                  <span className="uppercase font-black tracking-tighter text-2xl text-slate-900 leading-none">{siteConfig.name}</span>
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 leading-none mt-1">Plataforma Online</span>
                </div>
              </div>
          ) : (
            <div className="h-16 w-48 bg-slate-50 animate-pulse rounded-2xl" />
          )}
        </div>
        <CardTitle className="text-3xl font-black uppercase tracking-tight text-slate-900 leading-none">
          {isSignUp ? 'Nova Conta' : 'Acesso'}
        </CardTitle>
        <CardDescription className="text-slate-400 font-semibold pt-3 text-sm">
          {isSignUp ? 'Crie sua conta em poucos segundos' : 'Seja bem-vindo de volta'}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 md:px-10 pb-10 pt-0">
        <form onSubmit={handleAuth} className="space-y-6">
          {isSignUp && (
            <Tabs defaultValue="PF" onValueChange={(v) => setPersonType(v as 'PF' | 'PJ')} className="w-full mb-6">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-2xl h-14">
                <TabsTrigger value="PF" className="rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all h-full">
                  <User className="w-3.5 h-3.5 mr-2" />
                  Pessoa Física
                </TabsTrigger>
                <TabsTrigger value="PJ" className="rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all h-full">
                  <Building2 className="w-3.5 h-3.5 mr-2" />
                  Pessoa Jurídica
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {isSignUp ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {personType === 'PF' ? (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        placeholder="Nome e Sobrenome" 
                        value={registrationData.full_name}
                        onChange={(e) => setRegistrationData(prev => ({ ...prev, full_name: e.target.value }))}
                        required
                        className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 text-slate-900 font-medium placeholder:text-slate-300 focus:bg-white transition-all shadow-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Razão Social</Label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          placeholder="Nome da Empresa" 
                          value={registrationData.corporate_name}
                          onChange={(e) => setRegistrationData(prev => ({ ...prev, corporate_name: e.target.value }))}
                          required
                          className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 text-slate-900 font-medium placeholder:text-slate-300 focus:bg-white transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Nome Fantasia</Label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          placeholder="Como a empresa é conhecida" 
                          value={registrationData.trade_name}
                          onChange={(e) => setRegistrationData(prev => ({ ...prev, trade_name: e.target.value }))}
                          className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 text-slate-900 font-medium placeholder:text-slate-300 focus:bg-white transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">{personType === 'PF' ? 'CPF' : 'CNPJ'}</Label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder={personType === 'PF' ? "000.000.000-00" : "00.000.000/0000-00"}
                      value={registrationData.document}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, document: formatDocument(e.target.value, personType) }))}
                      required
                      className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 text-slate-900 font-medium placeholder:text-slate-300 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="email" 
                      placeholder="seu@email.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 text-slate-900 font-medium placeholder:text-slate-300 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Telefone</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="(00) 00000-0000" 
                      value={registrationData.phone}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                      required
                      className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 text-slate-900 font-medium placeholder:text-slate-300 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">WhatsApp</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="(00) 00000-0000" 
                      value={registrationData.whatsapp}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, whatsapp: formatPhone(e.target.value) }))}
                      className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 text-slate-900 font-medium placeholder:text-slate-300 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">CEP</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="00000-000" 
                      value={registrationData.cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      required
                      className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 text-slate-900 font-medium placeholder:text-slate-300 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Endereço Completo</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="Rua, Avenida, Logradouro..." 
                      value={registrationData.address}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, address: e.target.value }))}
                      required
                      className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 text-slate-900 font-medium placeholder:text-slate-300 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Número</Label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="123" 
                      value={registrationData.address_number}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, address_number: e.target.value }))}
                      required
                      className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 text-slate-900 font-medium placeholder:text-slate-300 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Complemento</Label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="Apto, Bloco, Sala..." 
                      value={registrationData.complement}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, complement: e.target.value }))}
                      className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 text-slate-900 font-medium placeholder:text-slate-300 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Bairro</Label>
                  <Input 
                    placeholder="Bairro" 
                    value={registrationData.neighborhood}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, neighborhood: e.target.value }))}
                    required
                    className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-slate-900 font-medium placeholder:text-slate-300 focus:bg-white transition-all shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 md:col-span-1">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Cidade</Label>
                    <Input 
                      placeholder="Cidade" 
                      value={registrationData.city}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, city: e.target.value }))}
                      required
                      className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-slate-900 font-medium placeholder:text-slate-300 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Estado</Label>
                    <Input 
                      placeholder="UF" 
                      maxLength={2}
                      value={registrationData.state}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                      required
                      className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-slate-900 font-medium placeholder:text-slate-300 text-center uppercase focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Defina sua Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="password" 
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 text-slate-900 font-medium placeholder:text-slate-300 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 text-slate-900 font-medium placeholder:text-slate-300 focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Senha</Label>
                  <button type="button" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-900 transition-colors">
                    Esqueceu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="password" 
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 text-slate-900 font-medium placeholder:text-slate-300 focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white rounded-[1.25rem] font-black uppercase tracking-[0.15em] text-xs shadow-[0_20px_40px_-12px_rgba(15,23,42,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Aguarde...
                </>
              ) : (
                isSignUp ? 'Finalizar Cadastro' : 'Entrar na Plataforma'
              )}
            </button>
          </div>

          <div className="text-center">
            <button 
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors py-2"
            >
              {isSignUp ? 'Já tem uma conta? Faça Login' : 'Não tem conta? Crie agora'}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
