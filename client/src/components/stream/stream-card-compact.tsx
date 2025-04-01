
import { Button } from "@/components/ui/button";
import { Stream } from "@/lib/types";
import { Copy, Edit, Clock } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { CardHover } from "@/components/ui/card-hover";
import { useToast } from "@/hooks/use-toast";
import { TokenIcon } from "@/components/ui/token-icon";
import { Link } from "react-router-dom";
import { useVaultQuery } from "@/hooks/use-vaults-query";

interface StreamCardCompactProps {
  stream: Stream;
  streamName: string;
  isReceiving?: boolean;
  isOwner: boolean;
  onEditName: () => void;
  hideVaultInfo?: boolean;
}

export function StreamCardCompact({ 
  stream, 
  streamName, 
  isReceiving = false, 
  isOwner,
  onEditName,
  hideVaultInfo = false
}: StreamCardCompactProps) {
  const { toast } = useToast();
  const { data: vault } = useVaultQuery(stream.vaultId);

  // Function to copy wallet address to clipboard
  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied",
      description: "The wallet address has been copied to your clipboard."
    });
  };

  // Format amount based on token type, without $ symbol
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Get vault name
  const vaultName = vault?.name || `Vault ${stream.vaultId.split('-')[1]}`;

  return (
    <CardHover className="h-full w-full p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${stream.active ? 'bg-green-500 animate-pulse-soft' : 'bg-gray-400'}`} />
          <h3 className="font-medium">{streamName}</h3>
          {isOwner && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5 p-0" 
              onClick={onEditName}
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="text-sm font-medium flex items-center gap-1.5">
          {formatAmount(stream.amountPerSecond)} 
          <div className="flex items-center gap-1">
            <TokenIcon token={stream.token} size="sm" />
            <span>{stream.token}</span>
          </div>
          /sec
        </div>
      </div>
      <div className="flex items-center justify-between">
        {!hideVaultInfo && (
          <>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs bg-secondary/50 hover:bg-secondary/70 px-2 py-0.5 rounded"
                  asChild
                >
                  <Link to={`/vaults/${stream.vaultId}`}>
                    {vaultName}
                  </Link>
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-48">
                <div className="text-sm">
                  <p className="font-semibold">{vaultName}</p>
                  <p className="text-muted-foreground text-xs mt-1">Tap to view vault details and related streams</p>
                </div>
              </HoverCardContent>
            </HoverCard>
            
            <div className="text-xs px-2 py-0.5 rounded bg-secondary/30">
              {isReceiving ? "Incoming" : "Outgoing"}
            </div>
          </>
        )}
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {isReceiving ? 'From:' : 'To:'} 
          <div className="flex items-center gap-1">
            <span>{isReceiving ? stream.source : stream.destination}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5 p-0" 
              onClick={() => copyToClipboard(isReceiving ? stream.source : stream.destination)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </CardHover>
  );
}
