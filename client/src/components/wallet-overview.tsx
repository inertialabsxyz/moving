
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/types";
import { Wallet } from "lucide-react";
import { useWalletContext } from "@/context/WalletContext";
import { TokenIcon } from "@/components/ui/token-icon";

export function WalletOverview() {
  const { currentWallet } = useWalletContext();

  return (
    <Card className="glass-card bg-opacity-60 border-opacity-30">
      <CardContent className="px-4 py-3">
        <div className="flex flex-row items-center justify-between gap-4">
          <Wallet className="h-4 w-4 text-primary/70 mr-1" />
          {Object.entries(currentWallet.balances || {}).map(([token, balance]) => (
            <div key={token} className="flex items-center gap-2">
              <span className="text-sm font-semibold">{formatCurrency(balance)}</span>
              <div className="flex items-center gap-1">
                <TokenIcon token={token} size="sm" />
                <span className="text-xs font-medium">{token}</span>
              </div>
            </div>
          ))}
          {(!currentWallet.balances || Object.keys(currentWallet.balances).length === 0) && (
            <div className="text-sm text-muted-foreground">No balances available</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
