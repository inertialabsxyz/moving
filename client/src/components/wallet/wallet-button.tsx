
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WalletIcon, ChevronDown, Loader2, LogOut } from "lucide-react";
import { useWalletContext } from "@/context/WalletContext";
import { formatAddress, formatCurrency } from "@/lib/types";
import { useApi } from "@/context/ApiContext";
import { TokenIcon } from "@/components/ui/token-icon";
import { useEffect } from "react";

export function WalletButton() {
  const { currentWallet, connecting, connected, connectWallet, disconnectWallet } = useWalletContext();
  const { apiConfig } = useApi();
  
  // For debugging
  useEffect(() => {
    console.log("WalletButton render - connected:", connected, "address:", currentWallet.address);
    console.log("WalletButton current wallet:", currentWallet);
  }, [connected, currentWallet]);
  
  // Display address or connecting status
  const displayText = connecting 
    ? "Connecting..." 
    : (connected ? formatAddress(currentWallet.address.toString()) : "Connect Wallet");
  
  // Show mock badge if using mock mode
  const isMockMode = apiConfig.useMock;

  // If not connected, show a simple button that directly connects to Nightly
  if (!connected) {
    return (
      <Button 
        variant="outline" 
        className="gap-1 relative" 
        onClick={connectWallet} 
        disabled={connecting}
      >
        {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletIcon className="h-4 w-4" />}
        <span className="hidden sm:inline">{displayText}</span>
        {isMockMode && (
          <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs px-1 rounded-full">
            MOCK
          </span>
        )}
      </Button>
    );
  }
  
  // If connected, show dropdown with balances and disconnect option
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-1 relative">
          <WalletIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{displayText}</span>
          {isMockMode && (
            <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs px-1 rounded-full">
              MOCK
            </span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="flex flex-col items-start gap-1">
          <span className="text-xs text-muted-foreground">Balances</span>
          <div className="w-full space-y-2 py-1">
            {currentWallet.balances && Object.entries(currentWallet.balances).length > 0 ? (
              Object.entries(currentWallet.balances).map(([token, balance]) => (
                <div key={token} className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <TokenIcon token={token} />
                    <span className="text-sm">{token}</span>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(balance)}</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No balances available</div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={disconnectWallet}>
          <LogOut className="h-4 w-4 mr-2" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
