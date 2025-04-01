
import { useState } from "react";
import { useWallet, WalletName } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { useWalletContext } from "@/context/WalletContext";
import { useApi } from "@/context/ApiContext";
import { Coins } from "lucide-react";
import { formatCurrency, getTokenColorClass } from "@/lib/types";

export function WalletSelector() {
  const { connectWallet, currentWallet } = useWalletContext();
  const { wallets, connect, wallet } = useWallet();
  const { apiConfig } = useApi();
  const isMockMode = apiConfig.useMock;
  
  const handleWalletSelect = async (walletName: WalletName) => {
    try {
      // Find the wallet by name
      const selectedWallet = wallets.find(w => w.name === walletName);
      if (selectedWallet) {
        // Connect with the selected wallet
        await connect(walletName);
        connectWallet();
      }
    } catch (error) {
      console.error("Error selecting wallet:", error);
    }
  };
  
  return (
    <div className="p-2 flex flex-col gap-2">
      {isMockMode ? (
        <div className="flex flex-col gap-2">
          <div className="text-sm text-center text-muted-foreground pb-1 border-b">
            Mock wallet balances:
          </div>
          <div className="space-y-2">
            {currentWallet.balances && Object.entries(currentWallet.balances).map(([token, balance]) => (
              <div key={token} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-primary/70" />
                  <span className="text-sm">{token}</span>
                </div>
                <span className="text-sm font-medium">{formatCurrency(balance)}</span>
              </div>
            ))}
          </div>
          <div className="text-xs italic text-muted-foreground pt-1 mt-1 border-t">
            Switch to real mode to connect a wallet
          </div>
        </div>
      ) : (
        <>
          <div className="text-sm mb-2">Select a wallet to connect:</div>
          {wallets.map((wallet) => (
            <Button
              key={wallet.name}
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => handleWalletSelect(wallet.name as WalletName)}
            >
              <img 
                src={wallet.icon} 
                alt={`${wallet.name} icon`} 
                className="h-5 w-5"
                onError={(e) => {
                  // If icon fails to load, remove it
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {wallet.name}
            </Button>
          ))}
        </>
      )}
    </div>
  );
}
