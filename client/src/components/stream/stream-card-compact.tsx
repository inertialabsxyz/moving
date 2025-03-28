import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAddress, Stream, getTokenColorClass } from "@/lib/types";
import { Copy, Edit, Clock, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { CardHover } from "@/components/ui/card-hover";
import { useToast } from "@/hooks/use-toast";

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
        <div className="text-sm font-medium flex items-center gap-1">
          {formatAmount(stream.amountPerSecond)} 
          <Badge variant="token" className={`ml-1 ${getTokenColorClass(stream.token)} text-white border-0`}>
            {stream.token}
          </Badge>
          /sec
        </div>
      </div>
      <div className="flex items-center justify-between">
        {!hideVaultInfo && (
          <>
            <HoverCard>
              <HoverCardTrigger>
                <Badge variant="outline" className="bg-secondary/50 hover:bg-secondary/70 cursor-pointer">
                  From Vault {stream.vaultId.split('-')[1]}
                </Badge>
              </HoverCardTrigger>
              <HoverCardContent className="w-48">
                <div className="text-sm">
                  <p className="font-semibold">Vault {stream.vaultId.split('-')[1]}</p>
                  <p className="text-muted-foreground text-xs mt-1">Tap to view vault details and related streams</p>
                </div>
              </HoverCardContent>
            </HoverCard>
            
            <Badge variant="token" className={isReceiving ? "bg-emerald-100 text-emerald-700 border-0" : "bg-blue-100 text-blue-700 border-0"}>
              {isReceiving ? "Incoming" : "Outgoing"}
            </Badge>
          </>
        )}
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {isReceiving ? 'From:' : 'To:'} 
          <div className="flex items-center gap-1">
            <span>{formatAddress(isReceiving ? stream.source : stream.destination)}</span>
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
