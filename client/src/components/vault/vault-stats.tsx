
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Copy, Plus, Trash, Wallet2 } from "lucide-react";
import { formatCurrency } from "@/lib/types";

interface VaultStatsProps {
  vault: {
    balance: number;
    token: string;
    owner: string;
    streams: Array<{
      active: boolean;
      amountPerSecond: number;
    }>;
  };
  totalStreamingRate: number;
  timeLeftInSeconds: number;
  activeStreamsPercentage: number;
  formatTimeLeft: (seconds: number) => string;
  onAddCreditClick: () => void;
  onDrainVaultClick: () => void;
  onDeleteVaultClick: () => void;
  copyToClipboard: (address: string) => void;
}

export function VaultStats({
  vault,
  totalStreamingRate, 
  timeLeftInSeconds, 
  activeStreamsPercentage,
  formatTimeLeft,
  onAddCreditClick,
  onDrainVaultClick,
  onDeleteVaultClick,
  copyToClipboard
}: VaultStatsProps) {
  return (
    <div className="glass-card rounded-xl p-6 mb-8">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">Vault Balance</h2>
            <p className="text-4xl font-bold">
              {formatCurrency(vault.balance)}
              <span className="text-xl ml-1">{vault.token}</span>
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Vault Owner</span>
              <div className="flex items-center gap-1">
                <span className="wallet-address">{vault.owner}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 p-0" 
                  onClick={() => copyToClipboard(vault.owner)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="text-sm font-medium mb-1">Total Streaming Rate</h3>
            <p className="text-2xl font-bold">
              {formatCurrency(totalStreamingRate)}<span className="text-base font-normal">/sec</span>
            </p>
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Vault Depletion</span>
                <span>{formatTimeLeft(timeLeftInSeconds)}</span>
              </div>
              <Progress 
                value={totalStreamingRate > 0 ? 100 - (timeLeftInSeconds / (30 * 24 * 3600)) * 100 : 0} 
                className="h-2"
              />
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="text-sm font-medium mb-1">Active Streams</h3>
            <p className="text-2xl font-bold">
              {vault.streams.filter(s => s.active).length}/{vault.streams.length}
            </p>
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Active</span>
                <span>{activeStreamsPercentage.toFixed(0)}%</span>
              </div>
              <Progress 
                value={activeStreamsPercentage} 
                className="h-2"
              />
            </div>
          </div>
        </div>
        
        <div className="flex flex-col justify-between gap-4">
          <Button onClick={onAddCreditClick} className="gap-1">
            <Plus className="h-4 w-4" /> Add Credit
          </Button>
          <Button 
            variant="outline" 
            className="gap-1"
            onClick={onDrainVaultClick}
          >
            <Wallet2 className="h-4 w-4" /> Drain Vault
          </Button>
          <Button 
            variant="outline" 
            className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1"
            onClick={onDeleteVaultClick}
          >
            <Trash className="h-4 w-4" /> Delete Vault
          </Button>
        </div>
      </div>
    </div>
  );
}
