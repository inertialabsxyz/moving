
import { Wallet2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Pool, formatCurrency } from "@/lib/types";
import { StatsCard, TokenDisplay } from "./stats-card";

interface PoolsCardProps {
  userPools: Pool[];
  poolTokens: Record<string, number>;
}

export function PoolsCard({ userPools, poolTokens }: PoolsCardProps) {
  return (
    <StatsCard
      title="My Vaults"
      icon={<Wallet2 className="h-5 w-5 text-primary" />}
      count={userPools.length}
      linkText="View all vaults"
      linkTo="/pools"
    >
      {Object.entries(poolTokens).length > 0 && (
        <>
          <div className="text-xs text-muted-foreground mb-1">Total funds across all vaults:</div>
          {Object.entries(poolTokens).map(([token, amount]) => (
            <TokenDisplay 
              key={token} 
              token={token} 
              amount={formatCurrency(amount)} 
            />
          ))}
        </>
      )}
    </StatsCard>
  );
}
