
import { Stream, mockWallet } from "@/lib/types";
import { EditNameDialog } from "@/components/stream/dialogs/edit-name-dialog";
import { CancelStreamDialog } from "@/components/stream/dialogs/cancel-stream-dialog";
import { WithdrawDialog } from "@/components/stream/dialogs/withdraw-dialog";
import { StreamCardCompact } from "@/components/stream/stream-card-compact";
import { StreamCardDetails } from "@/components/stream/stream-card-details";
import { useStream } from "@/hooks/use-stream";

interface StreamCardProps {
  stream: Stream;
  isReceiving?: boolean;
  compact?: boolean;
  hidePoolInfo?: boolean;
}

export function StreamCard({ stream, isReceiving = false, compact = false, hidePoolInfo = false }: StreamCardProps) {
  // Check if current user is stream owner or pool owner
  const isOwner = stream.source === mockWallet.address;
  
  const { 
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
  } = useStream({ stream });

  if (compact) {
    return (
      <>
        <StreamCardCompact 
          stream={stream}
          streamName={streamName}
          isReceiving={isReceiving}
          isOwner={isOwner}
          onEditName={() => setShowEditNameDialog(true)}
          hidePoolInfo={hidePoolInfo}
        />
        
        <EditNameDialog
          open={showEditNameDialog}
          onOpenChange={setShowEditNameDialog}
          currentName={streamName}
          onSave={handleSaveStreamName}
        />
      </>
    );
  }

  return (
    <>
      <StreamCardDetails
        stream={stream}
        streamName={streamName}
        isOwner={isOwner}
        isReceiving={isReceiving}
        currentTotal={currentTotal}
        withdrawalProgress={withdrawalProgress}
        pendingAmount={pendingAmount}
        isActive={isActive}
        onEditName={() => setShowEditNameDialog(true)}
        onWithdraw={() => setShowWithdrawDialog(true)}
        onCancel={() => setShowCancelDialog(true)}
        hidePoolInfo={hidePoolInfo}
      />

      {/* Dialogs */}
      <EditNameDialog
        open={showEditNameDialog}
        onOpenChange={setShowEditNameDialog}
        currentName={streamName}
        onSave={handleSaveStreamName}
      />

      <CancelStreamDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancelStream}
      />

      <WithdrawDialog
        open={showWithdrawDialog}
        onOpenChange={setShowWithdrawDialog}
        onConfirm={handleWithdraw}
        tokenAmount={formatAmount(pendingAmount)}
        tokenType={stream.token}
      />
    </>
  );
}
