
import { Wallet2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Vault, formatCurrency } from "@/lib/types";
import { StatsCard, TokenDisplay } from "./stats-card";

interface VaultsCardProps {
  userVaults: Vault[];
  vaultTokens: Record<string, number>;
}

export function VaultsCard({ userVaults, vaultTokens }: VaultsCardProps) {
  return (
    <StatsCard
      title="My Vaults"
      icon={<Wallet2 className="h-5 w-5 text-primary" />}
      count={userVaults.length}
      linkText="View all vaults"
      linkTo="/vaults"
    >
      {Object.entries(vaultTokens).length > 0 && (
        <>
          <div className="text-xs text-muted-foreground mb-1">Total funds across all vaults:</div>
          {Object.entries(vaultTokens).map(([token, amount]) => (
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
