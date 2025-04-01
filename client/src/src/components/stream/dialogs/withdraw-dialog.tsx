
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  tokenAmount: string;
  tokenType: string;
}

export function WithdrawDialog({ open, onOpenChange, onConfirm, tokenAmount, tokenType }: WithdrawDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Withdraw Available Funds</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to withdraw <span className="font-semibold">{tokenAmount} {tokenType}</span> from this stream. The entire available amount will be transferred to your wallet immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Withdraw
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
