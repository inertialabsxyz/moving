
import { Navigation } from "@/components/navigation";
import { StreamCard } from "@/components/stream-card";
import { CreateStreamDialog } from "@/components/create-stream-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownUp } from "lucide-react";
import { mockStreams, mockWallet } from "@/lib/types";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const Streams = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  
  // Check for tab parameter in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");
    if (tabParam && ["all", "outgoing", "incoming"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location]);

  // Filter streams by type
  const outgoingStreams = mockStreams.filter(
    (stream) => stream.source === mockWallet.address
  );
  
  const incomingStreams = mockStreams.filter(
    (stream) => stream.destination === mockWallet.address
  );
  
  const allStreams = [...outgoingStreams, ...incomingStreams];

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
            <CreateStreamDialog />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All Streams</TabsTrigger>
              <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
              <TabsTrigger value="incoming">Incoming</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              {allStreams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allStreams.map((stream) => (
                    <StreamCard 
                      key={stream.id} 
                      stream={stream} 
                      isReceiving={stream.destination === mockWallet.address}
                    />
                  ))}
                </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {outgoingStreams.map((stream) => (
                    <StreamCard key={stream.id} stream={stream} isReceiving={false} />
                  ))}
                </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {incomingStreams.map((stream) => (
                    <StreamCard key={stream.id} stream={stream} isReceiving={true} />
                  ))}
                </div>
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
          </Tabs>
        </section>
      </main>
    </div>
  );
};

export default Streams;
