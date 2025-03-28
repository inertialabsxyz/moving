
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/types";

interface AddCreditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (e: React.FormEvent) => Promise<void>;
  tokenType: string;
  creditAmount: string;
  setCreditAmount: (value: string) => void;
  loading: boolean;
}

export function AddCreditDialog({ 
  open, 
  onOpenChange, 
  onConfirm,
  tokenType,
  creditAmount,
  setCreditAmount,
  loading
}: AddCreditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Credit to Vault</DialogTitle>
          <DialogDescription>
            Add funds to your payment vault to cover ongoing streams.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onConfirm}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">{`Amount (${tokenType})`}</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !creditAmount}>
              {loading ? "Processing..." : `Add ${creditAmount ? formatCurrency(parseFloat(creditAmount)) : "0.00"} ${tokenType}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
