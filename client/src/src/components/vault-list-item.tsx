
import { formatAddress, formatCurrency, Vault } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, TrendingUp } from "lucide-react";

interface VaultListItemProps {
  vault: Vault;
}

export function VaultListItem({ vault }: VaultListItemProps) {
  const streamsCount = vault.streams?.length || 0;
  const vaultName = vault.name || `Vault ${vault.id.split("-")[1]}`;
  
  // Function to get token badge style
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
    <div className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/20 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <div className="font-medium">{vaultName}</div>
        <div className="text-xs text-muted-foreground">
          {formatAddress(vault.owner)}
        </div>
      </div>
      
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-1">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm">{streamsCount} stream{streamsCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-medium">{formatCurrency(vault.balance)}</span>
          <Badge variant="token" className={getTokenBadge(vault.token)}>
            {vault.token}
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to={`/vaults/${vault.id}`} className="flex items-center gap-1">
            Manage
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
