import { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, X, BadgeCheck, MapPin, User, Info, Upload, CheckCircle2, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { getSignedUrl } from '@/lib/storage';

interface SalesNoteViewerProps {
  isOpen: boolean;
  onClose: () => void;
  autoDownload?: boolean;
  data: {
    winnerId: string;
    date: string;
    lotTitle: string;
    lotOrder: number | string;
    auctionTitle: string;
    userName: string;
    userCpfCnpj?: string;
    userAddress?: string;
    bidAmount: number;
    commissionAmount: number;
    commissionRate: number;
    administrativeAmount: number;
    finalAmount: number;
    logoUrl?: string;
    siteName?: string;
    auctioneerName?: string;
    auctioneerRegistration?: string;
    logoHeight?: number;
  };
}

export function SalesNoteViewer({ isOpen, onClose, data, autoDownload = false }: SalesNoteViewerProps) {
  const { user } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [signedProofUrl, setSignedProofUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>({});
  const [hasAutoDownloaded, setHasAutoDownloaded] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data: settingsData } = await supabase.from('system_settings').select('*');
      if (settingsData) {
        const settingsMap: Record<string, any> = {};
        settingsData.forEach(s => {
          settingsMap[s.key] = s.value;
        });
        setSettings(settingsMap);
      }
    };

    const handleProofUrl = async () => {
      const url = proofUrl || (data as any).payment_proof_url;
      if (url) {
        const signed = await getSignedUrl('payment-proofs', url);
        setSignedProofUrl(signed);
      }
    };

    fetchSettings();
    handleProofUrl();
  }, [proofUrl, data]);

  useEffect(() => {
    if (isOpen && autoDownload && !hasAutoDownloaded && !isGeneratingPdf) {
      const timer = setTimeout(() => {
        handleDownload();
        setHasAutoDownloaded(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoDownload, hasAutoDownloaded, isGeneratingPdf]);

  const handleUploadProof = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${data.winnerId}/${Date.now()}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('auction_winners')
        .update({ 
          payment_proof_url: publicUrl,
          escrow_status: 'under_review'
        })
        .eq('id', data.winnerId);

      if (updateError) throw updateError;

      setProofUrl(publicUrl);
      toast.success('Comprovante enviado com sucesso!');
    } catch (error: any) {
      console.error('Error uploading proof:', error);
      toast.error('Erro ao enviar comprovante: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!contentRef.current) return;

    // Data validation
    const missingFields = [];
    if (!data.userCpfCnpj) missingFields.push('CPF/CNPJ');
    if (!data.userAddress) missingFields.push('Endereço');
    
    if (missingFields.length > 0) {
      toast.warning(`Atenção: ${missingFields.join(', ')} não preenchido(s).`);
    }

    setIsGeneratingPdf(true);
    const toastId = toast.loading('Gerando PDF otimizado...');

    try {
      const element = contentRef.current;
      const originalStyle = element.style.cssText;
      
      // Forces a specific style for capture to ensure mobile consistency
      element.style.width = '800px';
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.top = '0';
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('sales-note-content');
          if (clonedElement) {
            clonedElement.style.width = '800px';
            clonedElement.style.margin = '0';
          }
        }
      });
      
      element.style.cssText = originalStyle;
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
      
      const fileName = `NOTA_VENDA_${data.winnerId.slice(0, 8).toUpperCase()}.pdf`;
      pdf.save(fileName);

      if (user) {
        const pdfBlob = pdf.output('blob');
        const storagePath = `sales_notes/${data.winnerId}_${Date.now()}.pdf`;
        
        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(storagePath, pdfBlob);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('payment-proofs')
            .getPublicUrl(storagePath);

          await supabase.from('generated_pdfs').insert({
            user_id: user.id,
            winner_id: data.winnerId,
            name: fileName,
            url: publicUrl,
            type: 'sales_note'
          });

          // Also update the auction_winners record
          await supabase.from('auction_winners').update({ sales_note_url: publicUrl }).eq('id', data.winnerId);
        }
      }

      toast.success(`Nota de venda baixada!`, { id: toastId });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao baixar PDF.', { id: toastId });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[95vh] bg-white text-black p-0 overflow-hidden sm:rounded-[2.5rem]">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between bg-slate-50 no-print shrink-0">
          <DialogTitle className="text-lg font-black text-slate-900 uppercase italic tracking-tighter truncate pr-4">
            Nota de Venda #{data.winnerId.slice(0, 8)}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownload} 
              disabled={isGeneratingPdf}
              className="gap-2 font-bold uppercase text-[9px] sm:text-[10px] border-slate-300 rounded-xl h-9 px-2 sm:px-4"
            >
              {isGeneratingPdf ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <Download className="w-3 h-3 sm:w-4 sm:h-4" />}
              <span className="hidden xs:inline">PDF</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="hidden sm:flex gap-2 font-bold uppercase text-[10px] rounded-xl h-9">
              <Printer className="w-4 h-4" /> Imprimir
            </Button>
            <Button size="icon" onClick={onClose} className="bg-slate-900 text-white rounded-xl size-9 shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="h-full bg-slate-100/30">
          <div className="bg-white shadow-2xl mx-auto my-8 p-12 w-[210mm] min-h-[297mm] border border-slate-200 print:shadow-none print:border-none print:m-0 print:w-full" id="sales-note-content" ref={contentRef}>
            {/* Header */}
            <div className="grid grid-cols-2 gap-8 mb-10 border-b-2 border-slate-900 pb-8">
              <div className="flex flex-col justify-center">
                {data.logoUrl ? (
                  <img src={data.logoUrl} alt={data.siteName} style={{ height: `${(data.logoHeight || 64)}px` }} className="object-contain mb-4 mr-auto" />
                ) : (
                  <h1 className="text-3xl font-black uppercase tracking-tighter mb-2 italic">
                    {data.siteName || 'PLATAFORMA'} <span className="text-primary">LEILÕES</span>
                  </h1>
                )}
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  <p>{data.auctioneerName || 'Leiloeiro Oficial'}</p>
                  <p>Matrícula: {data.auctioneerRegistration || 'JUCESP 000'}</p>
                </div>
              </div>
              <div className="text-right flex flex-col justify-center">
                <h2 className="text-2xl font-black uppercase tracking-widest text-slate-900 italic">
                  {data.finalAmount > 0 && (data as any).payment_proof_url ? 'Recibo de Quitação' : 'Nota de Venda'}
                </h2>
                <p className="text-sm font-bold text-slate-500">Documento de Arremate nº {data.winnerId.slice(0, 8)}</p>
                <p className="text-xs text-slate-400 mt-1">Data de Emissão: {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-12 mb-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 border-b border-slate-200 pb-2">
                  <User className="size-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Dados do Arrematante</h3>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-bold text-slate-900">{data.userName}</p>
                  <p className="text-slate-600 font-medium">CPF/CNPJ: {data.userCpfCnpj || 'Não Informado'}</p>
                  <div className="flex gap-2 mt-2">
                    <MapPin className="size-3 text-slate-400 mt-1 shrink-0" />
                    <p className="text-slate-500 text-xs leading-relaxed italic">{data.userAddress || 'Endereço não cadastrado'}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 border-b border-slate-200 pb-2">
                  <Info className="size-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Dados do Leilão</h3>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-bold text-slate-900">{data.auctionTitle}</p>
                  <p className="text-slate-600 font-medium">Data do Evento: {data.date}</p>
                  <p className="text-primary font-black uppercase tracking-tighter italic mt-2">
                    Lote #{data.lotOrder} - {data.lotTitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Values Table */}
            <div className="mb-10">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest">Descrição do Item</th>
                    <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest">Valor do Arremate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-6">
                      <p className="font-black text-slate-900 uppercase">{data.lotTitle}</p>
                      <p className="text-[10px] text-slate-500 uppercase mt-1">Lote nº {data.lotOrder} - Conforme edital de leilão</p>
                    </td>
                    <td className="px-4 py-6 text-right font-black text-slate-900 tabular-nums">
                      R$ {data.bidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="flex justify-end mb-12">
              <div className="w-80 space-y-3">
                <div className="flex justify-between text-sm text-slate-600 font-medium">
                  <span>Valor do Lance:</span>
                  <span>R$ {data.bidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600 font-medium">
                  <span>Comissão Leiloeiro ({data.commissionRate}%):</span>
                  <span>R$ {data.commissionAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600 font-medium">
                  <span>Taxa Administrativa:</span>
                  <span>R$ {data.administrativeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-xl font-black text-slate-900 border-t-2 border-slate-900 pt-3 italic">
                  <span>TOTAL:</span>
                  <span>R$ {data.finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-[2rem] mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="size-6 text-green-600" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Instruções para Pagamento</h3>
                </div>
                {(signedProofUrl || (data as any).payment_proof_url) ? (
                  <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full border border-green-200">
                    <CheckCircle2 className="size-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Comprovante Enviado</span>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      id="proof-upload"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={handleUploadProof}
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="proof-upload"
                      className={cn(
                        "flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full cursor-pointer hover:bg-slate-800 transition-all shadow-lg",
                        isUploading && "opacity-50 pointer-events-none"
                      )}
                    >
                      {isUploading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Upload className="size-4" />
                      )}
                      <span className="text-[10px] font-black uppercase tracking-widest">Enviar Comprovante</span>
                    </label>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-6 font-medium italic">
                O pagamento deve ser efetuado integralmente em até 24 horas úteis. Utilize a chave PIX ou dados bancários abaixo. 
                Após realizar o pagamento, anexe o comprovante acima.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settings.enable_pix !== false && settings.pix_key && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Chave PIX</p>
                    <p className="font-black text-slate-900">{settings.pix_key}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{data.siteName || 'Mega Leilões'}</p>
                  </div>
                )}
                {settings.enable_bank_transfer !== false && settings.bank_details && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Dados Bancários</p>
                    <div className="text-[11px] font-bold text-slate-900 leading-tight whitespace-pre-wrap">
                      {settings.bank_details}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center space-y-8">
              <div className="pt-20 border-t border-slate-200 w-64 mx-auto">
                <p className="text-xs font-black uppercase text-slate-900 tracking-widest">{data.auctioneerName || 'Leiloeiro Oficial'}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Representante Legal</p>
              </div>
              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-[0.2em]">
                Este documento é uma cópia digital autenticada e gerada pelo sistema Mega Leilões Hot Toys.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
