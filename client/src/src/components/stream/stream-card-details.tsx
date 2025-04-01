
import { Button } from "@/components/ui/button";
import { CardHover } from "@/components/ui/card-hover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import { formatAddress, formatCurrency, Stream } from "@/lib/types";
import { ArrowUpRight, Check, Clock, Copy, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { TokenIcon } from "@/components/ui/token-icon";
import { useToast } from "@/hooks/use-toast";
import { useVaultQuery } from "@/hooks/use-vaults-query";

interface StreamCardDetailsProps {
  stream: Stream;
  streamName: string;
  isOwner: boolean;
  isReceiving: boolean;
  currentTotal: number;
  withdrawalProgress: number;
  pendingAmount: number;
  isActive: boolean;
  onEditName: () => void;
  onWithdraw: () => void;
  onCancel: () => void;
  hideVaultInfo?: boolean;
}

export function StreamCardDetails({
  stream,
  streamName,
  isOwner,
  isReceiving,
  currentTotal,
  withdrawalProgress,
  pendingAmount,
  isActive,
  onEditName,
  onWithdraw,
  onCancel,
  hideVaultInfo = false
}: StreamCardDetailsProps) {
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
  
  // Get vault name
  const vaultName = vault?.name || `Vault ${stream.vaultId.split('-')[1]}`;
  
  return (
    <CardHover className="h-full w-full overflow-hidden relative">
      <div className="absolute top-4 right-4 flex gap-1">
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
                  <p className="text-muted-foreground text-xs mt-1">
                    Click to view vault details and related streams
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
            
            <div className="text-xs px-2 py-0.5 rounded bg-secondary/30">
              {isReceiving ? "Incoming" : "Outgoing"}
            </div>
          </>
        )}
        
        <div className="text-xs px-2 py-0.5 rounded bg-secondary/50">
          {isActive ? "Active" : "Paused"}
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{streamName}</h3>
              {isOwner && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 p-0"
                  onClick={onEditName}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Started {new Date(stream.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Streaming rate
              </div>
              <div className="text-lg font-semibold flex items-center gap-1.5">
                {formatCurrency(stream.amountPerSecond)} 
                <div className="flex items-center gap-1">
                  <TokenIcon token={stream.token} />
                  <span>{stream.token}</span>
                </div>
                <span className="text-sm">/sec</span>
              </div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Total streamed
              </div>
              <div className="text-lg font-semibold flex items-center gap-1.5">
                {formatCurrency(currentTotal)} 
                <div className="flex items-center gap-1">
                  <TokenIcon token={stream.token} />
                  <span>{stream.token}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Recipient</span>
              <div className="flex items-center gap-1">
                <span>{formatAddress(stream.destination)}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 p-0"
                  onClick={() => copyToClipboard(stream.destination)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between text-sm mb-1 text-muted-foreground">
              <span>Withdrawn</span>
              <div className="flex items-center gap-1.5">
                <span>{formatCurrency(stream.totalWithdrawn)}</span>
                <TokenIcon token={stream.token} size="sm" />
                <span>{stream.token}</span>
              </div>
            </div>
            
            <div className="flex justify-between text-sm mb-1.5">
              <span>Available to withdraw</span>
              <div className="flex items-center gap-1.5 font-medium">
                <span>{formatCurrency(pendingAmount)}</span>
                <TokenIcon token={stream.token} size="sm" />
                <span>{stream.token}</span>
              </div>
            </div>
            
            <Progress value={withdrawalProgress} className="h-1.5 mb-4" />
            
            <div className="flex gap-2">
              {isReceiving ? (
                <Button 
                  className="flex-1 gap-1"
                  disabled={pendingAmount <= 0}
                  onClick={onWithdraw}
                >
                  <Check className="h-4 w-4" />
                  <span>Withdraw</span>
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="flex-1 gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                  onClick={onCancel}
                >
                  <span>Cancel Stream</span>
                </Button>
              )}
              
              {!hideVaultInfo && (
                <Button variant="outline" className="flex-1 gap-1" asChild>
                  <Link to={`/vaults/${stream.vaultId}`}>
                    <ArrowUpRight className="h-4 w-4" />
                    <span>View Vault</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </CardHover>
  );
}
