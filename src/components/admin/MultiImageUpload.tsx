import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, Image as ImageIcon, AlertCircle, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  bucket?: string;
}

export function MultiImageUpload({ value = [], onChange, label, bucket = 'auction-assets' }: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError(null);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const files = Array.from(event.target.files);
      const newUrls: string[] = [...value];

      for (const file of files) {
        // Basic validation
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`Arquivo ${file.name} muito grande. Máximo 5MB.`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${fileName}`;

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

        newUrls.push(publicUrl);
      }

      onChange(newUrls);
      toast.success('Imagens enviadas com sucesso!');
    } catch (err: any) {
      const msg = err.message || 'Erro desconhecido no upload';
      setError(msg);
      toast.error('Erro no upload: ' + msg);
      console.error('MultiImageUpload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newUrls = [...value];
    newUrls.splice(index, 1);
    onChange(newUrls);
  };

  return (
    <div className="space-y-3 w-full">
      {label && <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</label>}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {value.map((url, index) => (
          <div key={index} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white">
            <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
              <Button 
                type="button" 
                variant="destructive" 
                size="icon" 
                className="rounded-full w-8 h-8"
                onClick={() => removeImage(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        
        <div className={cn(
          "relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl aspect-square transition-all duration-300",
          "border-slate-200 bg-slate-50/50 hover:border-primary/40 hover:bg-slate-50",
          uploading && "animate-pulse"
        )}>
          {uploading ? (
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          ) : (
            <>
              <Plus className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-[10px] font-black uppercase tracking-tighter text-slate-900">Adicionar</span>
            </>
          )}
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={uploading}
          />
        </div>
      </div>
      
      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-500 bg-red-50 px-3 py-2 rounded-xl border border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-tight leading-tight">{error}</span>
        </div>
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
