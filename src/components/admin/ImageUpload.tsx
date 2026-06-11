import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  bucket?: string;
}

export function ImageUpload({ value, onChange, label, bucket = 'auction-assets' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError(null);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Selecione uma imagem.');
      }

      const file = event.target.files[0];
      
      // Basic validation
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Máximo 5MB.');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`; // Removed 'uploads/' prefix to simplify path

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(uploadError.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success('Imagem enviada com sucesso!');
    } catch (err: any) {
      const msg = err.message || 'Erro desconhecido no upload';
      setError(msg);
      toast.error('Erro no upload: ' + msg);
      console.error('ImageUpload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3 w-full">
      {label && <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</label>}
      <div className={cn(
        "relative flex flex-col items-center justify-center border-2 border-dashed rounded-[2rem] p-6 transition-all duration-300 min-h-[200px]",
        value ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50/50 hover:border-primary/40 hover:bg-slate-50",
        error && "border-red-200 bg-red-50/10"
      )}>
        {value ? (
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl group border border-slate-100">
            <img src={value} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
              <Button 
                type="button" 
                variant="destructive" 
                size="sm" 
                className="rounded-full font-black text-[10px] tracking-widest px-6 h-10 shadow-xl"
                onClick={() => onChange('')}
              >
                <X className="w-4 h-4 mr-2" /> REMOVER IMAGEM
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center w-full">
            <div className={cn(
              "mx-auto w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg mb-4 transition-all duration-500",
              uploading ? "bg-primary animate-pulse" : "bg-white group-hover:scale-110"
            )}>
              {uploading ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black uppercase tracking-tighter text-slate-900">Clique para enviar</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">PNG, JPG até 5MB</p>
            </div>
            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-500 bg-red-50 px-3 py-2 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-tight leading-tight">{error}</span>
              </div>
            )}
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function for cn
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

