import { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, X, PenTool, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { SignaturePad } from '../ui/SignaturePad';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { getSignedUrl } from '@/lib/storage';

interface ContractViewerProps {
  isOpen: boolean;
  onClose: () => void;
  autoDownload?: boolean;
  contractData: {
    winnerId?: string;
    number: string;
    date: string;
    lotName: string;
    userName: string;
    amount: number;
    bidAmount?: number;
    commissionAmount?: number;
    administrativeAmount?: number;
    commissionRate?: number;
    logoUrl?: string;
    siteName?: string;
    auctioneerName?: string;
    auctioneerRegistration?: string;
    logoHeight?: number;
    digitalSignatureUrl?: string;
    digitallySignedAt?: string;
  };
}

export function ContractViewer({ isOpen, onClose, contractData, autoDownload = false }: ContractViewerProps) {
  const { user } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isSignaturePadOpen, setIsSignaturePadOpen] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [signedSignatureUrl, setSignedSignatureUrl] = useState<string | null>(null);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [hasAutoDownloaded, setHasAutoDownloaded] = useState(false);

  useEffect(() => {
    const initSignature = async () => {
      const url = contractData.digitalSignatureUrl || null;
      setSignatureUrl(url);
      if (url) {
        const signed = await getSignedUrl('payment-proofs', url);
        setSignedSignatureUrl(signed);
      }
    };
    
    setSignedAt(contractData.digitallySignedAt || null);
    initSignature();

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
    fetchSettings();
  }, [contractData]);

  useEffect(() => {
    if (isOpen && autoDownload && !hasAutoDownloaded && !isSaving) {
      const timer = setTimeout(() => {
        handleDownload();
        setHasAutoDownloaded(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoDownload, hasAutoDownloaded, isSaving]);

  // Function to generate and save PDF to history
  const generateAndSavePdf = async (isSigned = false) => {
    if (!contentRef.current || !user) return null;

    try {
      const element = contentRef.current;
      const originalStyle = element.style.cssText;
      
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
          const clonedElement = clonedDoc.getElementById('contract-content');
          if (clonedElement) {
            clonedElement.style.width = '800px';
            clonedElement.style.padding = '40px';
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
      
      const contractNumber = (contractData.number || contractData.winnerId || '00000000').toString();
      const fileName = `${isSigned ? 'CONTRATO_ASSINADO' : 'CONTRATO'}_${contractNumber.toUpperCase()}.pdf`;
      const pdfBlob = pdf.output('blob');
      const storagePath = `${user.id}/contracts/${isSigned ? 'signed' : 'draft'}/${contractNumber}_${Date.now()}.pdf`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(storagePath, pdfBlob, { upsert: true });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(storagePath);

        await supabase.from('generated_pdfs').insert({
          user_id: user.id,
          winner_id: contractData.winnerId,
          name: fileName,
          url: publicUrl,
          type: 'contract'
        });
        
        if (contractData.winnerId) {
           await supabase.from('contracts').upsert({ 
             winner_id: contractData.winnerId,
             contract_url: publicUrl,
             status: isSigned ? 'signed' : 'active',
             updated_at: new Date().toISOString()
           }, { onConflict: 'winner_id' });
        }
        return { publicUrl, fileName, pdf };
      }
    } catch (err) {
      console.error('Error in generateAndSavePdf:', err);
    }
    return null;
  };

  const handleSaveSignature = async (dataUrl: string) => {
    if (!contractData.winnerId || !user) return;
    
    setIsSigning(true);
    const toastId = toast.loading('Salvando assinatura e gerando contrato assinado...');
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const fileName = `${user.id}/signatures/${contractData.winnerId}_${Date.now()}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('auction_winners')
        .update({ 
          digital_signature_url: publicUrl,
          digitally_signed_at: now
        })
        .eq('id', contractData.winnerId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setSignatureUrl(publicUrl);
      setSignedAt(now);
      setIsSignaturePadOpen(false);

      setTimeout(async () => {
        const result = await generateAndSavePdf(true);
        if (result) {
          result.pdf.save(result.fileName);
          toast.success('Contrato assinado e PDF gerado!', { id: toastId });
        } else {
          toast.success('Assinatura salva!', { id: toastId });
        }
        setIsSigning(false);
      }, 500);
      
    } catch (error: any) {
      console.error('Error signing contract:', error);
      toast.error('Erro ao assinar: ' + error.message, { id: toastId });
      setIsSigning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!contentRef.current) return;

    if (!contractData.userName) {
      toast.error('Nome do arrematante não identificado.');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('Gerando contrato em PDF...');

    try {
      const result = await generateAndSavePdf(!!signatureUrl);
      if (result) {
        result.pdf.save(result.fileName);
        toast.success(`PDF ${result.fileName} gerado com sucesso!`, { id: toastId });
      } else {
        toast.error('Erro ao salvar PDF no servidor.', { id: toastId });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] bg-white text-black p-0 overflow-hidden sm:rounded-[2rem]">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between bg-slate-50 no-print shrink-0">
          <DialogTitle className="text-lg font-bold text-slate-900 truncate pr-4">
            Contrato #{contractData.number || contractData.winnerId?.slice(0, 8) || '---'}
          </DialogTitle>
          <div className="flex items-center gap-2">
            {!signatureUrl && contractData.winnerId && (
              <Button 
                onClick={() => setIsSignaturePadOpen(true)}
                disabled={isSigning}
                className="bg-gold text-black hover:bg-gold-light gap-2 font-black uppercase text-[9px] sm:text-[10px] animate-pulse shadow-glow-gold rounded-xl px-2 sm:px-4 h-9"
              >
                {isSigning ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <PenTool className="w-3 h-3 sm:w-4 sm:h-4" />}
                <span className="hidden xs:inline">{isSigning ? 'Assinando...' : 'Assinar'}</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownload} 
              disabled={isSaving}
              className="gap-2 font-bold uppercase text-[9px] sm:text-[10px] border-slate-300 rounded-xl h-9 px-2 sm:px-4"
            >
              {isSaving ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <Download className="w-3 h-3 sm:w-4 sm:h-4" />}
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
        
        <ScrollArea className="h-full p-4 sm:p-12 bg-slate-100/50">
          <div className="bg-white shadow-xl mx-auto p-8 sm:p-16 min-h-[1000px] border border-slate-200 print:m-0 print:p-8 print:shadow-none" id="contract-content" ref={contentRef}>
            {/* Header with Logo */}
            <div className="flex flex-col items-center mb-12 border-b pb-8">
              {contractData.logoUrl ? (
                <img src={contractData.logoUrl} alt={contractData.siteName} style={{ height: `${(contractData.logoHeight || 80)}px` }} className="object-contain mb-4" />
              ) : (
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">{contractData.siteName || 'PLATAFORMA'}</h1>
              )}
              <div className="text-center">
                <h2 className="text-xl font-bold uppercase tracking-widest">Contrato de Arremate de Bens</h2>
                <p className="text-sm text-slate-500 mt-1">Instrumento Particular de Promessa de Compra e Venda</p>
              </div>
            </div>

            {/* Body */}
            <div className="space-y-8 text-sm leading-relaxed text-slate-700">
              <section>
                <h3 className="font-bold text-slate-900 uppercase mb-3 border-l-4 border-slate-900 pl-3">1. Identificação das Partes</h3>
                <p>
                  <strong>LEILOEIRO:</strong> {contractData.auctioneerName || 'N/A'} - Matrícula {contractData.auctioneerRegistration || 'N/A'}.<br />
                  <strong>PLATAFORMA:</strong> {contractData.siteName || 'N/A'}.<br />
                  <strong>ARREMATANTE:</strong> {contractData.userName || 'N/A'}.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 uppercase mb-3 border-l-4 border-slate-900 pl-3">2. Objeto do Contrato</h3>
                <p>
                  O presente instrumento tem por objeto a formalização do arremate do lote identificado como <strong>{contractData.lotName || '---'}</strong>, 
                  realizado em leilão público eletrônico na data de {contractData.date || '---'}.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 uppercase mb-3 border-l-4 border-slate-900 pl-3">3. Preço e Condições de Pagamento</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between border-b pb-1">
                    <span>Valor do Lance:</span>
                    <span className="font-bold">R$ {(contractData.bidAmount || contractData.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {contractData.commissionAmount && (
                    <div className="flex justify-between border-b pb-1">
                      <span>Comissão do Leiloeiro ({contractData.commissionRate || 5}%):</span>
                      <span className="font-bold">R$ {contractData.commissionAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {contractData.administrativeAmount && (
                    <div className="flex justify-between border-b pb-1">
                      <span>Taxa Administrativa:</span>
                      <span className="font-bold">R$ {contractData.administrativeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg pt-2">
                    <span className="font-black">TOTAL A PAGAR:</span>
                    <span className="font-black">R$ {(contractData.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <p>
                  O arrematante obriga-se a efetuar o pagamento integral dos valores acima descritos no prazo máximo de 24 horas úteis,
                  {settings.enable_pix !== false && settings.pix_key && ` utilizando a chave PIX (${settings.pix_key})`}
                  {settings.enable_bank_transfer !== false && settings.bank_details && ` ou transferência bancária (${settings.bank_details.replace(/\n/g, ', ')})`},
                  sob pena de cancelamento do arremate e aplicação de multa conforme edital.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 uppercase mb-3 border-l-4 border-slate-900 pl-3">4. Responsabilidades do Arrematante</h3>
                <p>
                  O arrematante declara ter pleno conhecimento do estado de conservação do bem, que é vendido no estado em que se encontra ("as is"), sem garantias adicionais além das previstas no edital do leilão.
                  A não quitação do valor total no prazo estipulado ensejará o cancelamento do arremate, perda do sinal/caução e aplicação de multa de 20% sobre o valor do lance.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 uppercase mb-3 border-l-4 border-slate-900 pl-3">5. Entrega do Bem</h3>
                <p>
                  A retirada ou envio do lote arrematado ocorrerá somente após a compensação integral dos valores e assinatura deste instrumento. 
                  As despesas de logística, frete e seguro são de inteira responsabilidade do arrematante.
                </p>
              </section>

              {/* Signature Section */}
              <div className="mt-20 pt-10 border-t-2 border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-20">
                <div className="flex flex-col items-center">
                  <div className="w-full border-b border-slate-400 mb-2 h-20 flex items-center justify-center">
                    {signedSignatureUrl ? (
                      <img src={signedSignatureUrl} alt="Assinatura" className="max-h-full object-contain" />
                    ) : signatureUrl ? (
                      <img src={signatureUrl} alt="Assinatura" className="max-h-full object-contain" />
                    ) : (
                      <span className="text-slate-300 text-xs italic">Aguardando Assinatura Digital</span>
                    )}
                  </div>
                  <p className="font-bold text-xs uppercase">{contractData.userName}</p>
                  <p className="text-[10px] text-slate-400">ARREMATANTE</p>
                  {signedAt && (
                    <p className="text-[9px] text-green-600 font-bold mt-1">
                      Assinado em: {format(new Date(signedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-full border-b border-slate-400 mb-2 h-20 flex items-center justify-center">
                    <p className="font-black italic text-lg opacity-20 select-none uppercase tracking-tighter">Assinado Digitalmente</p>
                  </div>
                  <p className="font-bold text-xs uppercase">{contractData.auctioneerName || 'Leiloeiro Oficial'}</p>
                  <p className="text-[10px] text-slate-400">LEILOEIRO / PLATAFORMA</p>
                </div>
              </div>

              <div className="mt-20 text-[9px] text-slate-400 text-center leading-relaxed">
                <p>Este documento possui validade jurídica conforme a MP 2.200-2/2001 e legislações vigentes sobre leilões públicos eletrônicos.</p>
                <p>Identificador Único: {contractData.winnerId || contractData.number}</p>
              </div>
            </div>
          </div>
        </ScrollArea>

        {isSignaturePadOpen && (
          <SignaturePad 
            isOpen={isSignaturePadOpen}
            onClose={() => setIsSignaturePadOpen(false)}
            onSave={handleSaveSignature}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}