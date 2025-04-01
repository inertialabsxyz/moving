
import { Wallet2 } from "lucide-react";
import { Vault, formatCurrency } from "@/lib/types";
import { StatsCard } from "./stats-card";
import { TokenIcon } from "@/components/ui/token-icon";

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
            <div key={token} className="flex items-center justify-between text-sm">
              <span className="font-medium">{formatCurrency(amount)}</span>
              <div className="flex items-center gap-1.5">
                <TokenIcon token={token} />
                <span>{token}</span>
              </div>
            </div>
          ))}
        </>
      )}
    </StatsCard>
  );
}
