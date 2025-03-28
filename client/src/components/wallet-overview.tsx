
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, mockWallet } from "@/lib/types";
import { Wallet } from "lucide-react";

export function WalletOverview() {
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

  return (
    <Card className="glass-card bg-opacity-60 border-opacity-30">
      <CardContent className="px-4 py-3">
        <div className="flex flex-row items-center justify-between gap-4">
          <Wallet className="h-4 w-4 text-primary/70 mr-1" />
          {Object.entries(mockWallet.balances || {}).map(([token, balance]) => (
            <div key={token} className="flex items-center gap-2">
              <span className="text-sm font-semibold">{formatCurrency(balance)}</span>
              <Badge variant="token" className={`${getTokenBadge(token)} text-xs px-1.5 py-0.5`}>
                {token}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
