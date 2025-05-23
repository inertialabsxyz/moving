import { useState, useEffect } from "react";
import { Stream } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useCancelStreamMutation } from "@/hooks/use-stream-mutations";

interface UseStreamProps {
  stream: Stream;
  initialName?: string;
}

export function useStream({ stream, initialName }: UseStreamProps) {
  const [currentTotal, setCurrentTotal] = useState(stream.totalStreamed);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [isActive, setIsActive] = useState(stream.active);
  const [showEditNameDialog, setShowEditNameDialog] = useState(false);
  // Use stream.name if it exists, otherwise fall back to initialName or generated name
  const [streamName, setStreamName] = useState(
    stream.name || initialName || `Stream ${stream.id.split('-')[1]}`
  );
  const { toast } = useToast();
  
  // Get the cancel stream mutation
  const cancelStreamMutation = useCancelStreamMutation();
  
  // Simulate real-time streaming by increasing totalStreamed
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setCurrentTotal(prev => {
        const newTotal = prev + stream.amountPerSecond;
        return newTotal;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isActive, stream.amountPerSecond]);
  
  const pendingAmount = currentTotal - stream.totalWithdrawn;
  const withdrawalProgress = (stream.totalWithdrawn / currentTotal) * 100;
  
  // Format amount based on token type, without $ symbol
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  const handleCancelStream = async () => {
    try {
      // Use the mutation to cancel the stream
      await cancelStreamMutation.mutateAsync(stream.id);
      
      // Update local state after successful cancellation
      setIsActive(false);
      toast({
        title: "Stream Cancelled",
        description: `${streamName} has been cancelled.`,
      });
    } catch (error) {
      console.error("Failed to cancel stream:", error);
      toast({
        title: "Failed to Cancel Stream",
        description: "There was an error while cancelling the stream.",
        variant: "destructive"
      });
    } finally {
      setShowCancelDialog(false);
    }
  };
  
  const handleWithdraw = () => {
    // In a real implementation, this would call a backend API to withdraw funds
    toast({
      title: "Funds Withdrawn",
      description: `${formatAmount(pendingAmount)} ${stream.token} has been withdrawn from ${streamName}.`,
    });
    setShowWithdrawDialog(false);
  };

  const handleSaveStreamName = (newName: string) => {
    setStreamName(newName);
    toast({
      title: "Stream Name Updated",
      description: `Stream name has been updated to "${newName}".`
    });
  };

  return {
    currentTotal,
    showCancelDialog,
    setShowCancelDialog,
    showWithdrawDialog,
    setShowWithdrawDialog,
    isActive,
    showEditNameDialog,
    setShowEditNameDialog,
    streamName,
    pendingAmount,
    withdrawalProgress,
    formatAmount,
    handleCancelStream,
    handleWithdraw,
    handleSaveStreamName,
  };
}
