
import { Button } from "@/components/ui/button";
import { ChevronRight, Clock, Copy, Edit, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatAddress, formatCurrency } from "@/lib/types";
import { CreateStreamDialog } from "@/components/create-stream-dialog";
import { useVaultStreamsQuery } from "@/hooks/use-streams-query";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { StreamCard } from "@/components/stream-card";
import { useVaultQuery } from "@/hooks/use-vaults-query";
import { 
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import { ViewToggle, ViewMode } from "@/components/ui/view-toggle";
import { StreamListItem } from "@/components/stream-list-item";
import { useCancelStreamMutation } from "@/hooks/use-stream-mutations";

interface StreamsListProps {
  vaultId: string;
}

export function StreamsList({ vaultId }: StreamsListProps) {
  const { data: streams, isLoading } = useVaultStreamsQuery(vaultId);
  const { data: vault } = useVaultQuery(vaultId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [highlightedStreamId, setHighlightedStreamId] = useState<string | null>(null);
  const newStreamRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const cancelStreamMutation = useCancelStreamMutation();

  // Observe DOM for changes to handle scrolling when new stream is added
  useEffect(() => {
    if (highlightedStreamId && streams?.length) {
      const observer = new MutationObserver(() => {
        if (newStreamRef.current) {
          newStreamRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          // Add and remove highlight class
          newStreamRef.current.classList.add('highlight-item');
          setTimeout(() => {
            if (newStreamRef.current) {
              newStreamRef.current.classList.remove('highlight-item');
              setHighlightedStreamId(null);
            }
          }, 2000);
        }
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
      return () => observer.disconnect();
    }
  }, [highlightedStreamId, streams]);

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied",
      description: "The address has been copied to your clipboard."
    });
  };

  // Function to handle highlighting a new stream
  const handleCreateStream = (newStreamId: string) => {
    setShowCreateDialog(false);
    setHighlightedStreamId(newStreamId);
  };

  // Function to handle cancelling a stream
  const handleCancelStream = async (streamId: string) => {
    try {
      await cancelStreamMutation.mutateAsync(streamId);
      toast({
        title: "Stream Cancelled",
        description: "The stream has been successfully cancelled."
      });
    } catch (error) {
      console.error("Error cancelling stream:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="my-8 animate-pulse text-muted-foreground text-center py-8">
        Loading streams...
      </div>
    );
  }

  if (!streams || streams.length === 0) {
    return (
      <div className="my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Streams</h2>
          <CreateStreamDialog
            vaultId={vaultId}
            onSuccess={handleCreateStream}
          />
        </div>
        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/30">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium mb-2">No Streams Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            This vault doesn't have any streams. Create your first stream to start sending continuous payments.
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Stream
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Streams</h2>
        <div className="flex items-center gap-2">
          <ViewToggle view={viewMode} onChange={setViewMode} />
          <CreateStreamDialog
            vaultId={vaultId}
            onSuccess={handleCreateStream}
          />
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {streams.map((stream) => (
            <div 
              key={stream.id} 
              ref={stream.id === highlightedStreamId ? newStreamRef : null}
              className="transition-all"
            >
              <StreamCard 
                stream={stream} 
                hideVaultInfo={true} 
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2 mt-4">
          {streams.map((stream) => (
            <div 
              key={stream.id} 
              ref={stream.id === highlightedStreamId ? newStreamRef : null}
              className="transition-all"
            >
              <StreamListItem 
                stream={stream}
                streamName={stream.name || `Stream to ${stream.destination}`} 
                hideVaultInfo={true}
                onCancel={() => handleCancelStream(stream.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
