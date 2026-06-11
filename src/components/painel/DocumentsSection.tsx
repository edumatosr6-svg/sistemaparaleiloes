import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, CheckCircle2, Clock, AlertCircle, Loader2, Download } from "lucide-react";
import { SkeletonPremium } from "@/components/ui/skeleton-premium";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function DocumentsSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: documents, isLoading: isDocsLoading } = useQuery({
    queryKey: ["user-documents", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: generatedPdfs, isLoading: isPdfsLoading } = useQuery({
    queryKey: ["generated-pdfs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("generated_pdfs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: string = "Documento") => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-documents')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from("user_documents")
        .insert({
          user_id: user.id,
          type,
          status: "pending",
          url: publicUrl,
        });

      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ["user-documents", user?.id] });
      toast.success("Documento enviado para análise!");
    } catch (error: any) {
      toast.error("Erro ao enviar documento: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const isLoading = isDocsLoading || isPdfsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <SkeletonPremium className="h-10 w-48" />
          <SkeletonPremium className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <SkeletonPremium key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">Meus Documentos</h1>
          <p className="text-sm text-gray-400">Mantenha sua documentação em dia para participar dos leilões.</p>
        </div>
        <div className="relative">
          <input
            type="file"
            id="doc-upload"
            className="hidden"
            onChange={(e) => handleFileUpload(e)}
            disabled={uploading}
            accept=".pdf,.jpg,.jpeg,.png"
          />
          <Button 
            className="gap-2 bg-gold text-black hover:bg-gold-light font-black uppercase tracking-widest text-xs h-10 px-6 rounded-xl"
            disabled={uploading}
            onClick={() => document.getElementById('doc-upload')?.click()}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Enviando..." : "Enviar Novo"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents && documents.length > 0 ? (
          documents.map((doc) => (
            <Card key={doc.id} className="border-none bg-brand-900/50 shadow-sm overflow-hidden group hover:bg-brand-800 transition-colors">
              <CardContent className="p-0">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-800 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-black text-white uppercase italic text-sm">{doc.type}</h3>
                      <p className="text-[10px] text-gray-500 font-bold">Enviado em {new Date(doc.created_at || Date.now()).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.status === "approved" && (
                      <div className="flex items-center gap-1 text-green-400 text-[10px] font-black uppercase tracking-widest bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Aprovado
                      </div>
                    )}
                    {doc.status === "pending" && (
                      <div className="flex items-center gap-1 text-gold text-[10px] font-black uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full border border-gold/20">
                        <Clock className="w-3 h-3" />
                        Pendente
                      </div>
                    )}
                    {doc.status === "rejected" && (
                      <div className="flex items-center gap-1 text-red-400 text-[10px] font-black uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                        <AlertCircle className="w-3 h-3" />
                        Recusado
                      </div>
                    )}
                  </div>
                </div>
                {doc.status === "rejected" && doc.rejection_reason && (
                  <div className="px-4 py-2 bg-red-500/10 text-red-400 text-[10px] font-bold border-t border-red-500/20">
                    Motivo: {doc.rejection_reason}
                  </div>
                )}
                <div className="px-4 py-3 bg-brand-800/50 border-t border-brand-700 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest h-8 text-gray-400 hover:text-white" onClick={() => window.open(doc.url, "_blank")}>Visualizar</Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-2 py-12 text-center text-gray-500 border-2 border-dashed border-brand-700 rounded-3xl bg-brand-900/30">
            <FileText className="w-12 h-12 text-brand-700 mx-auto mb-4 opacity-50" />
            <p className="font-black uppercase tracking-widest text-xs">Nenhum documento enviado ainda.</p>
          </div>
        )}
      </div>

      {/* Histórico de PDFs Gerados */}
      <div className="space-y-6 pt-10 border-t border-brand-800">
        <div>
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Histórico de Arremates</h2>
          <p className="text-sm text-gray-400">Acesse seus contratos e notas de venda gerados anteriormente.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {generatedPdfs && generatedPdfs.length > 0 ? (
            generatedPdfs.map((pdf) => (
              <Card key={pdf.id} className="border-none bg-brand-900/40 shadow-xl overflow-hidden group hover:border-gold/30 transition-all rounded-3xl border-2 border-transparent">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-800 flex items-center justify-center shadow-lg">
                      <FileText className="w-6 h-6 text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-white uppercase italic text-sm truncate">{pdf.name}</h3>
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5">
                        {pdf.type === 'contract' ? 'Contrato' : 'Nota de Venda'} • {new Date(pdf.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-brand-700 text-white hover:bg-gold hover:text-black font-black uppercase tracking-widest text-[9px] h-8 rounded-xl"
                      onClick={() => window.open(pdf.url, '_blank')}
                    >
                      <Download className="w-3 h-3 mr-2" />
                      Baixar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-gray-500 border-2 border-dashed border-brand-800 rounded-[3rem] bg-brand-900/20">
              <Clock className="w-12 h-12 text-brand-800 mx-auto mb-4 opacity-30" />
              <p className="font-black uppercase tracking-widest text-[10px]">Nenhum histórico de PDF disponível.</p>
            </div>
          )}
        </div>
      </div>

      <Card className="border-dashed border-2 bg-brand-900/30 border-brand-700 rounded-[3rem] mt-12">
        <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-brand-800 flex items-center justify-center shadow-glow-gold rotate-3">
            <Upload className="w-8 h-8 text-gold" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Precisa enviar mais documentos?</h3>
            <p className="text-sm text-gray-400 max-w-sm mt-2">
              Para arremates de alto valor, podemos solicitar documentos adicionais ou comprovantes de residência.
            </p>
          </div>
          <div className="flex gap-4">
            <input
              type="file"
              id="doc-upload-complementary"
              className="hidden"
              onChange={(e) => handleFileUpload(e, "Complementar")}
              disabled={uploading}
            />
            <Button 
              variant="outline" 
              className="border-brand-700 text-white hover:bg-gold hover:text-black font-black uppercase tracking-widest text-xs h-12 px-8 rounded-2xl transition-all"
              onClick={() => document.getElementById('doc-upload-complementary')?.click()}
              disabled={uploading}
            >
              {uploading ? "Enviando..." : "Enviar Comprovante"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
