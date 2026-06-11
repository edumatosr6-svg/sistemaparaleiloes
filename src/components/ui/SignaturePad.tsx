import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { X, Check, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface SignaturePadProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
  title?: string;
}

export function SignaturePad({ isOpen, onClose, onSave, title = "Assinatura Digital" }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const clear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const save = () => {
    if (sigCanvas.current?.isEmpty()) return;
    const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (dataUrl) {
      onSave(dataUrl);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">{title}</DialogTitle>
          <p className="text-sm text-slate-500">Use o mouse ou o dedo para assinar no campo abaixo.</p>
        </DialogHeader>
        
        <div className="border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 overflow-hidden my-4">
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              className: "signature-canvas w-full h-64 cursor-crosshair",
              width: 500,
              height: 256
            }}
            onBegin={() => setIsEmpty(false)}
            penColor="#0f172a"
          />
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={clear} className="gap-2">
            <RotateCcw className="size-4" /> Limpar
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={save} 
            disabled={isEmpty}
            className="bg-slate-900 text-white gap-2 hover:bg-slate-800"
          >
            <Check className="size-4" /> Confirmar Assinatura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
