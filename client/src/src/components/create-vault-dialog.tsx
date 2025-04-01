
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_TOKENS, TokenSymbol, mockWallet } from "@/lib/types";
import { useCreateVaultMutation } from "@/hooks/use-vault-mutations";

export function CreateVaultDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<TokenSymbol>(SUPPORTED_TOKENS[0].symbol);
  
  // Use the create vault mutation hook
  const createVaultMutation = useCreateVaultMutation();

  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const initialBalance = parseFloat(amount);
    if (isNaN(initialBalance) || initialBalance <= 0) return;
    
    // Create vault data
    const vaultData = {
      name: name || `Vault ${Date.now().toString().slice(-4)}`,
      balance: initialBalance,
      token,
      owner: mockWallet.address,
    };
    
    // Execute the mutation
    await createVaultMutation.mutateAsync(vaultData);
    
    // Reset form and close dialog
    setOpen(false);
    setName("");
    setAmount("");
    setToken(SUPPORTED_TOKENS[0].symbol);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1">
          <Plus className="h-4 w-4" /> New Vault
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Payment Vault</DialogTitle>
          <DialogDescription>
            Create a new payment vault to stream funds to recipients.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateVault}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Vault Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="My Payment Vault"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Give your vault a descriptive name to easily identify it later.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="amount">Initial Deposit</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="token">Token</Label>
              <Select
                value={token}
                onValueChange={(value: TokenSymbol) => setToken(value)}
              >
                <SelectTrigger id="token">
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_TOKENS.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Select the token for your payment vault.
              </p>
            </div>
            
            <p className="text-sm text-muted-foreground">
              You can add more funds to your vault anytime.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createVaultMutation.isPending || !amount}
            >
              {createVaultMutation.isPending ? "Creating..." : "Create Vault"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
