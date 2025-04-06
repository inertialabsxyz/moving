
import { useState } from "react";
import { useWalletContext } from "@/context/WalletContext";
import { useWalletQuery } from "@/hooks/use-wallet-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAddress, SUPPORTED_TOKENS, TokenSymbol } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApi } from "@/context/ApiContext";
import { useQueryClient } from "@tanstack/react-query";

export function ExampleTransaction() {
  const { currentWallet, connected } = useWalletContext();
  const { data: wallet, refreshWallet } = useWalletQuery();
  const { toast } = useToast();
  const { apiConfig } = useApi();
  const queryClient = useQueryClient();
  
  // Form state
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<TokenSymbol>(SUPPORTED_TOKENS[0].symbol);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!recipient || !amount || parseFloat(amount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please provide a valid recipient address and amount."
      });
      return;
    }
    
    // Check if connected to wallet (when not in mock mode)
    if (!apiConfig.useMock && !connected) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet to send transactions."
      });
      return;
    }
    
    // Check if user has sufficient balance
    const tokenBalance = wallet.balances?.[token] || 0;
    if (parseFloat(amount) > tokenBalance) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: `You don't have enough ${token} to complete this transaction.`
      });
      return;
    }
    
    // Start transaction
    setIsSubmitting(true);
    
    try {
      if (apiConfig.useMock) {
        // Mock transaction in mock mode
        // This simulates a transaction without actually making one
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In mock mode, let's simulate the balance change
        toast({
          title: "Transaction Simulated",
          description: `Mock transfer of ${amount} ${token} to ${formatAddress(recipient)}`
        });
        
        // Refresh wallet data to reflect the new balance
        refreshWallet();
      } else {
        // In real mode, we would use the Aptos SDK to create and submit a transaction
        
        // Example of how this would work with Aptos SDK:
        /*
        const { aptosClient, account } = useWallet();
        
        // Create transaction payload
        const payload = {
          type: "entry_function_payload",
          function: `${apiConfig.tokenContracts[token]}::transfer`,
          type_arguments: [],
          arguments: [recipient, parseFloat(amount) * 100000000] // Convert to smallest unit
        };
        
        // Sign and submit transaction
        const pendingTx = await aptosClient.generateSignSubmitTransaction(
          account!.address,
          payload
        );
        
        // Wait for transaction
        const txResult = await aptosClient.waitForTransaction(pendingTx.hash);
        */
        
        // Since we can't implement the actual transaction without the full SDK setup,
        // we'll just show a message for this example
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast({
          title: "Transaction Not Implemented",
          description: "This is just an example component. In a real implementation, you would use the Aptos SDK to submit this transaction."
        });
        
        // Refresh wallet data after transaction
        refreshWallet();
      }
    } catch (error) {
      console.error("Transaction error:", error);
      toast({
        variant: "destructive",
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setIsSubmitting(false);
      
      // Clear form after submission
      setRecipient("");
      setAmount("");
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Send Transaction Example</CardTitle>
        <CardDescription>
          This is an example of how to construct a transaction using the wallet context.
          {apiConfig.useMock && " (Running in mock mode)"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="token">Token</Label>
            <Select
              value={token}
              onValueChange={(value: TokenSymbol) => setToken(value)}
            >
              <SelectTrigger id="token">
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_TOKENS.map((tokenInfo) => (
                  <SelectItem key={tokenInfo.symbol} value={tokenInfo.symbol}>
                    {tokenInfo.symbol} - {tokenInfo.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {wallet.balances && wallet.balances[token] !== undefined && (
            <div className="text-sm text-muted-foreground">
              Available balance: {wallet.balances[token]} {token}
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleSubmit}
          disabled={isSubmitting || !recipient || !amount}
        >
          {isSubmitting ? "Processing..." : `Send ${token}`}
        </Button>
      </CardFooter>
    </Card>
  );
}
