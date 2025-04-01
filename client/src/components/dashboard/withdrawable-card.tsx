
import { Banknote } from "lucide-react";
import { formatCurrency } from "@/lib/types";
import { StatsCard } from "./stats-card";
import { TokenIcon } from "@/components/ui/token-icon";

interface WithdrawableCardProps {
  availableToWithdraw: Record<string, number>;
}

export function WithdrawableCard({ availableToWithdraw }: WithdrawableCardProps) {
  return (
    <StatsCard
      title="Available to Withdraw"
      icon={<Banknote className="h-5 w-5 text-primary" />}
      linkText="View incoming streams"
      linkTo="/streams?tab=incoming"
    >
      {Object.keys(availableToWithdraw).length > 0 ? (
        <div className="space-y-2">
          {Object.entries(availableToWithdraw).map(([token, amount]) => (
            <div key={`withdraw-${token}`} className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {formatCurrency(amount)}
              </div>
              <div className="flex items-center gap-1.5">
                <TokenIcon token={token} size="lg" />
                <span className="text-sm font-medium">{token}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-3xl font-bold text-muted-foreground">0.00</p>
      )}
    </StatsCard>
  );
}
