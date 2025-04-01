
import { Stream } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TokenIcon } from "@/components/ui/token-icon";
import { ArrowUpRight, Check, Copy, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { CancelStreamDialog } from "@/components/stream/dialogs/cancel-stream-dialog";
import { WithdrawDialog } from "@/components/stream/dialogs/withdraw-dialog";
import { useStream } from "@/hooks/use-stream";
import { useVaultQuery } from "@/hooks/use-vaults-query";

interface StreamListItemProps {
  stream: Stream;
  isReceiving?: boolean;
  streamName: string;
  onEditName?: () => void;
  onCancel?: () => void;
  onWithdraw?: () => void;
  hideVaultInfo?: boolean;
}

export function StreamListItem({ 
  stream, 
  isReceiving = false, 
  streamName,
  onEditName,
  onCancel,
  onWithdraw,
  hideVaultInfo = false 
}: StreamListItemProps) {
  const { toast } = useToast();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const { data: vault } = useVaultQuery(stream.vaultId);

  // Use the useStream hook to get real-time values
  const { 
    currentTotal, 
    isActive,
    formatAmount,
    handleCancelStream
  } = useStream({ 
    stream, 
    initialName: streamName 
  });

  // Copy address to clipboard
  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied",
      description: "The wallet address has been copied to your clipboard."
    });
  };

  // Handle the cancel confirmation
  const handleCancelConfirm = () => {
    if (onCancel) {
      onCancel();
    }
    setShowCancelDialog(false);
  };

  // Handle the withdraw confirmation
  const handleWithdrawConfirm = () => {
    if (onWithdraw) {
      onWithdraw();
    }
    setShowWithdrawDialog(false);
  };

  // Calculate pending amount (what can be withdrawn)
  const pendingAmount = currentTotal - stream.totalWithdrawn;

  // Get vault name
  const vaultName = vault?.name || `Vault ${stream.vaultId.split('-')[1]}`;

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex flex-col space-y-3">
            {/* Top row with stream info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse-soft' : 'bg-gray-400'}`} />
                <div className="font-medium">{streamName}</div>
                {!hideVaultInfo && (
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
            
            {/* Middle row with address and total streamed */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {isReceiving ? 'From:' : 'To:'} 
                <span className="font-mono text-xs">{isReceiving ? stream.source : stream.destination}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 p-0" 
                  onClick={() => copyToClipboard(isReceiving ? stream.source : stream.destination)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="text-xs px-2 py-0.5 rounded bg-secondary/40">
                {isReceiving ? "Incoming" : "Outgoing"}
              </div>
            </div>
            
            {/* Total streamed row */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total streamed:</span>
              <div className="font-medium flex items-center gap-1.5">
                {formatAmount(currentTotal)} 
                <TokenIcon token={stream.token} size="sm" />
                <span>{stream.token}</span>
              </div>
            </div>
            
            {/* Button row - Updated with consistent styling and icons */}
            {(isReceiving || onCancel || !hideVaultInfo) && (
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                {isReceiving && isActive && onWithdraw && (
                  <Button 
                    variant="default" 
                    size="sm"
                    className="gap-1"
                    onClick={() => setShowWithdrawDialog(true)}
                  >
                    <Check className="h-4 w-4" />
                    Withdraw
                  </Button>
                )}
                
                {/* View Vault Button - Updated with icon */}
                {!hideVaultInfo && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-9 gap-1"
                    asChild
                  >
                    <Link to={`/vaults/${stream.vaultId}`}>
                      <ArrowUpRight className="h-4 w-4" />
                      View Vault
                    </Link>
                  </Button>
                )}
                
                {/* Cancel Stream Button - Now with consistent styling */}
                {isActive && onCancel && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-9 gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    <X className="h-4 w-4" />
                    Cancel Stream
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cancel Stream Dialog */}
      <CancelStreamDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancelConfirm}
      />

      {/* Withdraw Dialog */}
      <WithdrawDialog
        open={showWithdrawDialog}
        onOpenChange={setShowWithdrawDialog}
        onConfirm={handleWithdrawConfirm}
        tokenAmount={formatAmount(pendingAmount)}
        tokenType={stream.token}
      />
    </>
  );
}
