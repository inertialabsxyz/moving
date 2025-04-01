
import { CardHover } from "@/components/ui/card-hover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAddress, formatCurrency, Vault } from "@/lib/types";
import { Link } from "react-router-dom";
import { Banknote, TrendingUp, Wallet } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface VaultCardProps {
  vault: Vault;
  compact?: boolean;
}

export function VaultCard({ vault, compact = false }: VaultCardProps) {
  const [addCreditOpen, setAddCreditOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [loading, setLoading] = useState(false);
  
  const streamsCount = vault.streams?.length || 0;
  const vaultName = vault.name || `Vault ${vault.id.split("-")[1]}`;
  
  const handleAddCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success(`Added ${formatCurrency(parseFloat(creditAmount))} to vault`);
    setLoading(false);
    setAddCreditOpen(false);
    setCreditAmount("");
  };
  
  // Function to get token badge style
  const getTokenBadge = (token: string) => {
    switch (token) {
      case "USDC":
        return "bg-blue-500/90 text-white border-0";
      case "MOVE":
        return "bg-purple-500/90 text-white border-0";
      default:
        return "bg-gray-500 text-white border-0";
    }
  };
  
  if (compact) {
    return (
      <CardHover className="h-full w-full p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <h3 className="font-medium">{vaultName}</h3>
          </div>
          <div className="text-sm flex items-center gap-1">
            {formatCurrency(vault.balance)}
            <Badge variant="token" className={getTokenBadge(vault.token)}>
              {vault.token}
            </Badge>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {streamsCount} stream{streamsCount !== 1 ? 's' : ''}
          </div>
          <Link 
            to={`/vaults/${vault.id}`}
            className="text-xs text-primary font-medium link-hover inline-block"
          >
            View details
          </Link>
        </div>
      </CardHover>
    );
  }

  return (
    <>
      <CardHover className="h-full w-full">
        <div className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 rounded-full p-2">
                  <Banknote className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{vaultName}</h3>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(vault.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold flex items-center justify-end gap-1">
                  {formatCurrency(vault.balance)}
                  <Badge variant="token" className={getTokenBadge(vault.token)}>
                    {vault.token}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Available balance
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-sm text-muted-foreground">Owner</div>
                <div className="wallet-address">{formatAddress(vault.owner)}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-sm text-muted-foreground">Active Streams</div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>{streamsCount} stream{streamsCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-2">
              <Button asChild variant="default" className="flex-1">
                <Link to={`/vaults/${vault.id}`}>Manage Vault</Link>
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setAddCreditOpen(true)}
              >
                Add Credit
              </Button>
            </div>
          </div>
        </div>
      </CardHover>

      {/* Add Credit Dialog */}
      <Dialog open={addCreditOpen} onOpenChange={setAddCreditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Credit to Vault</DialogTitle>
            <DialogDescription>
              Add funds to your payment vault to cover ongoing streams.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCredit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="flex items-center gap-2">
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
                  <Badge variant="token" className={`${getTokenBadge(vault.token)}`}>
                    {vault.token}
                  </Badge>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddCreditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !creditAmount}>
                {loading ? "Processing..." : `Add ${creditAmount ? formatCurrency(parseFloat(creditAmount)) : "0.00"}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
