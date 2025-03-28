
import { Banknote } from "lucide-react";
import { formatCurrency, getTokenColorClass } from "@/lib/types";
import { StatsCard } from "./stats-card";
import { Badge } from "@/components/ui/badge";

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
              <Badge variant="token" className={`${getTokenColorClass(token)} text-white border-0 text-sm px-2 py-0.5`}>
                {token}
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-3xl font-bold text-muted-foreground">0.00</p>
      )}
    </StatsCard>
  );
}
