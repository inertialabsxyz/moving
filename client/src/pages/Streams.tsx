import { Navigation } from "@/components/navigation";
import { StreamCard } from "@/components/stream-card";
import { CreateStreamDialog } from "@/components/create-stream-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownUp } from "lucide-react";
import { mockWallet } from "@/lib/types";
import { useEffect, useState, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useStreamsQuery } from "@/hooks/use-streams-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewToggle, ViewMode } from "@/components/ui/view-toggle";
import { StreamListItem } from "@/components/stream-list-item";
import { useCancelStreamMutation, useWithdrawFromStreamMutation } from "@/hooks/use-stream-mutations";
import { useToast } from "@/hooks/use-toast";

const Streams = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [highlightedStreamId, setHighlightedStreamId] = useState<string | null>(null);
  const highlightedRef = useRef<HTMLDivElement>(null);
  
  // Fetch streams using the query hook
  const { data: streams = [], isLoading, error } = useStreamsQuery();
  
  // Check for tab parameter in URL and highlight parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["all", "outgoing", "incoming"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    
    // Check for highlighted stream
    const highlightParam = searchParams.get("highlight");
    if (highlightParam) {
      setHighlightedStreamId(highlightParam);
      
      // Clear the highlight after 10 seconds
      const timer = setTimeout(() => {
        setHighlightedStreamId(null);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Scroll to highlighted stream when it's available
  useEffect(() => {
    if (highlightedStreamId && highlightedRef.current) {
      // More reliable approach: use a mutation observer to detect when the DOM is fully ready
      const observer = new MutationObserver((mutations, obs) => {
        if (highlightedRef.current) {
          // Scroll with a slight delay to ensure rendering is complete
          setTimeout(() => {
            if (highlightedRef.current) {
              highlightedRef.current.scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
              });
              
              // Stop observing once we've scrolled
              obs.disconnect();
            }
          }, 300);
        }
      });
      
      // Start observing the document with the configured parameters
      observer.observe(document, { 
        childList: true, 
        subtree: true 
      });
      
      // Clean up observer
      return () => observer.disconnect();
    }
  }, [highlightedStreamId, activeTab, isLoading, streams]);

  // Filter streams by type
  const outgoingStreams = streams.filter(
    (stream) => stream.source === mockWallet.address
  );
  
  const incomingStreams = streams.filter(
    (stream) => stream.destination === mockWallet.address
  );
  
  const allStreams = [...outgoingStreams, ...incomingStreams];

  // Add mutations for stream actions
  const cancelStreamMutation = useCancelStreamMutation();
  const withdrawMutation = useWithdrawFromStreamMutation();
  const { toast } = useToast();

  // Handlers for stream actions - defined at the component level, not in the loop
  const handleCancelStream = async (streamId: string) => {
    try {
      await cancelStreamMutation.mutateAsync(streamId);
      toast({
        title: "Stream Cancelled",
        description: "The stream has been successfully cancelled."
      });
    } catch (error) {
      console.error("Error cancelling stream:", error);
      toast({
        title: "Error",
        description: "Failed to cancel stream. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleWithdrawStream = async (streamId: string) => {
    // For simplicity, we're using a fixed amount to withdraw
    // In a real app, you'd want to show a dialog to let the user specify the amount
    try {
      const stream = streams.find(s => s.id === streamId);
      if (!stream) return;
      
      const availableAmount = stream.totalStreamed - stream.totalWithdrawn;
      
      if (availableAmount <= 0) {
        toast({
          title: "Nothing to withdraw",
          description: "There are no funds available to withdraw from this stream."
        });
        return;
      }
      
      await withdrawMutation.mutateAsync({ id: streamId, amount: availableAmount });
      toast({
        title: "Withdrawal Successful",
        description: `Successfully withdrew ${availableAmount.toFixed(2)} ${stream.token} from the stream.`
      });
    } catch (error) {
      console.error("Error withdrawing from stream:", error);
      toast({
        title: "Error",
        description: "Failed to withdraw from stream. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Function to determine if a stream should be highlighted
  const shouldHighlight = (streamId: string) => {
    return streamId === highlightedStreamId;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="pt-20 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <section className="page-transition mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Payment Streams</h1>
              <p className="text-muted-foreground mt-1">
                Manage all your incoming and outgoing payment streams
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ViewToggle view={viewMode} onChange={setViewMode} />
              <CreateStreamDialog />
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All Streams</TabsTrigger>
              <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
              <TabsTrigger value="incoming">Incoming</TabsTrigger>
            </TabsList>
            
            {isLoading ? (
              <div className="mt-4 grid grid-cols-1 gap-4">
                {[1, 2, 3, 4].map((index) => (
                  <div key={index} className="p-6 rounded-lg border">
                    <Skeleton className="h-6 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-5 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="mt-4 p-4 border border-destructive/50 rounded-md bg-destructive/10 text-destructive">
                Error loading streams: {error instanceof Error ? error.message : "Unknown error"}
              </div>
            ) : (
              <>
                <TabsContent value="all" className="mt-4">
                  {allStreams.length > 0 ? (
                    viewMode === "grid" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allStreams.map((stream) => (
                          <div 
                            key={stream.id} 
                            ref={shouldHighlight(stream.id) ? highlightedRef : null}
                            className={shouldHighlight(stream.id) ? "animate-pulse-slow transition-all duration-300 ring-2 ring-primary rounded-lg" : ""}
                          >
                            <StreamCard 
                              stream={stream} 
                              isReceiving={stream.destination === mockWallet.address}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {allStreams.map((stream) => (
                          <div 
                            key={stream.id} 
                            ref={shouldHighlight(stream.id) ? highlightedRef : null}
                            className={shouldHighlight(stream.id) ? "animate-pulse-slow transition-all duration-300 ring-2 ring-primary rounded-lg" : ""}
                          >
                            <StreamListItem
                              stream={stream} 
                              streamName={stream.name || `Stream ${stream.id.substring(0, 6)}`}
                              isReceiving={stream.destination === mockWallet.address}
                              onCancel={stream.source === mockWallet.address ? () => handleCancelStream(stream.id) : undefined}
                              onWithdraw={stream.destination === mockWallet.address ? () => handleWithdrawStream(stream.id) : undefined}
                            />
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="bg-muted rounded-full p-4 mb-4">
                        <ArrowDownUp className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h2 className="text-xl font-semibold mb-2">No streams found</h2>
                      <p className="text-muted-foreground max-w-md mb-6">
                        You don't have any payment streams yet. Create your first stream to start sending or receiving payments.
                      </p>
                      <CreateStreamDialog />
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="outgoing" className="mt-4">
                  {outgoingStreams.length > 0 ? (
                    viewMode === "grid" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {outgoingStreams.map((stream) => (
                          <div 
                            key={stream.id} 
                            ref={shouldHighlight(stream.id) ? highlightedRef : null}
                            className={shouldHighlight(stream.id) ? "animate-pulse-slow transition-all duration-300 ring-2 ring-primary rounded-lg" : ""}
                          >
                            <StreamCard key={stream.id} stream={stream} isReceiving={false} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {outgoingStreams.map((stream) => (
                          <div 
                            key={stream.id} 
                            ref={shouldHighlight(stream.id) ? highlightedRef : null}
                            className={shouldHighlight(stream.id) ? "animate-pulse-slow transition-all duration-300 ring-2 ring-primary rounded-lg" : ""}
                          >
                            <StreamListItem 
                              stream={stream} 
                              streamName={stream.name || `Stream to ${stream.destination.substring(0, 6)}...`}
                              isReceiving={false}
                              onCancel={() => handleCancelStream(stream.id)}
                            />
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="bg-muted rounded-full p-4 mb-4">
                        <ArrowDownUp className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h2 className="text-xl font-semibold mb-2">No outgoing streams</h2>
                      <p className="text-muted-foreground max-w-md mb-6">
                        You haven't created any payment streams yet. Create your first stream to start sending payments.
                      </p>
                      <CreateStreamDialog />
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="incoming" className="mt-4">
                  {incomingStreams.length > 0 ? (
                    viewMode === "grid" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {incomingStreams.map((stream) => (
                          <div 
                            key={stream.id} 
                            ref={shouldHighlight(stream.id) ? highlightedRef : null}
                            className={shouldHighlight(stream.id) ? "animate-pulse-slow transition-all duration-300 ring-2 ring-primary rounded-lg" : ""}
                          >
                            <StreamCard key={stream.id} stream={stream} isReceiving={true} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {incomingStreams.map((stream) => (
                          <div 
                            key={stream.id} 
                            ref={shouldHighlight(stream.id) ? highlightedRef : null}
                            className={shouldHighlight(stream.id) ? "animate-pulse-slow transition-all duration-300 ring-2 ring-primary rounded-lg" : ""}
                          >
                            <StreamListItem 
                              stream={stream} 
                              streamName={stream.name || `Stream from ${stream.source.substring(0, 6)}...`}
                              isReceiving={true}
                              onWithdraw={() => handleWithdrawStream(stream.id)}
                            />
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="bg-muted rounded-full p-4 mb-4">
                        <ArrowDownUp className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h2 className="text-xl font-semibold mb-2">No incoming streams</h2>
                      <p className="text-muted-foreground max-w-md mb-6">
                        You aren't receiving any payment streams yet.
                      </p>
                      <Button asChild variant="outline">
                        <a href="#" className="gap-1">Learn how to receive payments</a>
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        </section>
      </main>
    </div>
  );
};

export default Streams;
