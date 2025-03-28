
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DrainPoolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (amount: number) => void;
  poolBalance: number;
  tokenType: string;
}

export function DrainPoolDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  poolBalance, 
  tokenType 
}: DrainPoolDialogProps) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<string>(poolBalance.toString());
  const [error, setError] = useState<string>("");
  
  const validateAmount = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setError("Please enter a valid number");
      return false;
    }
    if (numValue <= 0) {
      setError("Amount must be greater than zero");
      return false;
    }
    if (numValue > poolBalance) {
      setError(`Cannot exceed vault balance of ${poolBalance.toFixed(2)} ${tokenType}`);
      return false;
    }
    setError("");
    return true;
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    validateAmount(value);
  };
  
  const handleConfirm = async () => {
    if (!validateAmount(amount)) {
      return;
    }
    
    setLoading(true);
    await onConfirm(parseFloat(amount));
    setLoading(false);
  };
  
  const handleDialogOpen = (open: boolean) => {
    if (open) {
      // Reset to default state when opening
      setAmount(poolBalance.toString());
      setError("");
    }
    onOpenChange(open);
  };
  
  return (
    <AlertDialog open={open} onOpenChange={handleDialogOpen}>
      <AlertDialogContent className="fixed max-w-md w-full max-h-[90vh] overflow-y-auto">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
        
        <AlertDialogHeader>
          <AlertDialogTitle>Drain Vault</AlertDialogTitle>
          <AlertDialogDescription>
            Specify the amount you want to withdraw from this vault. The funds will be transferred to your wallet immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="drain-amount">
              Amount <span className="text-xs text-muted-foreground">(Max: {poolBalance.toFixed(2)} {tokenType})</span>
            </Label>
            <Input
              id="drain-amount"
              type="number"
              step="0.01"
              min="0.01"
              max={poolBalance}
              value={amount}
              onChange={handleAmountChange}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading || !!error || !amount}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? "Processing..." : `Drain ${parseFloat(amount).toFixed(2)} ${tokenType}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
