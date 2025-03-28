
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WalletIcon, ChevronDown, Coins } from "lucide-react";
import { useWalletContext } from "@/context/WalletContext";
import { formatAddress, formatCurrency } from "@/lib/types";
import { useApi } from "@/context/ApiContext";
import { WalletSelector } from "./wallet-selector";

export function WalletButton() {
  const { currentWallet, connecting, connected, disconnectWallet } = useWalletContext();
  const { apiConfig } = useApi();
  
  // Display address or connecting status
  const displayText = connecting 
    ? "Connecting..." 
    : (currentWallet.address ? formatAddress(currentWallet.address) : "Connect Wallet");
  
  // Show mock badge if using mock mode
  const isMockMode = apiConfig.useMock;
  
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
        
        {connected ? (
          <>
            <DropdownMenuItem className="flex flex-col items-start gap-1">
              <span className="text-xs text-muted-foreground">Balances</span>
              <div className="w-full space-y-2 py-1">
                {currentWallet.balances && Object.entries(currentWallet.balances).length > 0 ? (
                  Object.entries(currentWallet.balances).map(([token, balance]) => (
                    <div key={token} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-primary/70" />
                        <span className="text-sm">{token}</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(balance)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No balances available</div>
                )}
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={disconnectWallet}>
              <span>Disconnect</span>
            </DropdownMenuItem>
          </>
        ) : (
          <WalletSelector />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
