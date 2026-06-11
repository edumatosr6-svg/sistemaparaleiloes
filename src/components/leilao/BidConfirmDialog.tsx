import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/utils";

interface BidConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
  lotTitle?: string;
  title?: string;
  description?: string;
}

export function BidConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  amount,
  lotTitle,
  title = "Confirmar Lance",
  description,
}: BidConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-brand-900 border-brand-800 text-white rounded-[2rem]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl section-title text-white">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-brand-400">
            {description ? (
              description
            ) : (
              <>
                {lotTitle ? (
                  <>Você está prestes a dar um lance no lote <strong>{lotTitle}</strong> no valor de:</>
                ) : (
                  <>Você está prestes a dar um lance no valor de:</>
                )}
                <span className="block text-3xl font-black text-gold mt-4 text-center tabular-nums">
                  {formatCurrency(amount)}
                </span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel 
            onClick={onClose}
            className="bg-transparent border-brand-700 text-brand-400 hover:bg-brand-800 hover:text-white rounded-xl"
          >
            CANCELAR
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-gold text-black hover:bg-gold-light font-black rounded-xl px-8"
          >
            CONFIRMAR LANCE
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
