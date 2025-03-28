
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardHover } from "@/components/ui/card-hover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import { formatAddress, formatCurrency, Stream } from "@/lib/types";
import { ArrowUpRight, Check, Clock, Copy, Edit } from "lucide-react";
import { Link } from "react-router-dom";

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
    <CardHover className="h-full w-full overflow-hidden relative">
      <div className="absolute top-4 right-4 flex gap-1">
        {!hideVaultInfo && (
          <>
            <HoverCard>
              <HoverCardTrigger>
                <Badge variant="outline" className="bg-secondary/50 hover:bg-secondary/70 cursor-pointer">
                  Vault {stream.vaultId.split('-')[1]}
                </Badge>
              </HoverCardTrigger>
              <HoverCardContent className="w-48">
                <div className="text-sm">
                  <p className="font-semibold">Vault {stream.vaultId.split('-')[1]}</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Click to view vault details and related streams
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
            
            <Badge variant="token" className={isReceiving ? "bg-emerald-100 text-emerald-700 border-0" : "bg-blue-100 text-blue-700 border-0"}>
              {isReceiving ? "Incoming" : "Outgoing"}
            </Badge>
          </>
        )}
        
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Paused"}
        </Badge>
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
              <div className="text-lg font-semibold flex items-center gap-1">
                {formatCurrency(stream.amountPerSecond)} 
                <Badge variant="token" className={`${getTokenBadge(stream.token)}`}>
                  {stream.token}
                </Badge>
                <span className="text-sm">/sec</span>
              </div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Total streamed
              </div>
              <div className="text-lg font-semibold flex items-center">
                {formatCurrency(currentTotal)} 
                <Badge variant="token" className={`ml-1 ${getTokenBadge(stream.token)}`}>
                  {stream.token}
                </Badge>
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
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between text-sm mb-1 text-muted-foreground">
              <span>Withdrawn</span>
              <span>
                {formatCurrency(stream.totalWithdrawn)} {stream.token}
              </span>
            </div>
            
            <div className="flex justify-between text-sm mb-1.5">
              <span>Available to withdraw</span>
              <span className="font-medium">
                {formatCurrency(pendingAmount)} {stream.token}
              </span>
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
