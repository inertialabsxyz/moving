
import { Navigation } from "@/components/navigation";
import { CreateVaultDialog } from "@/components/create-vault-dialog.tsx";
import { CreateStreamDialog } from "@/components/create-stream-dialog";
import { mockVaults, mockStreams, mockWallet } from "@/lib/types";
import { useEffect, useState } from "react";
import { StatsSection } from "@/components/dashboard/stats-section";
import { StreamsSection } from "@/components/dashboard/streams-section";
import { RecentActivity } from "@/components/dashboard/recent-activity";

const Index = () => {
  // Filter streams where current user is the destination
  const incomingStreams = mockStreams.filter(
    (stream) => stream.destination === mockWallet.address && stream.active
  );
  
  // Filter streams where current user is the source
  const outgoingStreams = mockStreams.filter(
    (stream) => stream.source === mockWallet.address && stream.active
  );

  // Get only the user's vaults
  const userVaults = mockVaults.filter(
    (vault) => vault.owner === mockWallet.address
  );
  
  // Calculate total tokens in vaults
  const vaultTokens = userVaults.reduce((acc, vault) => {
    acc[vault.token] = (acc[vault.token] || 0) + vault.balance;
    return acc;
  }, {} as Record<string, number>);
  
  // State for dynamic token amounts
  const [dynamicIncomingTokens, setDynamicIncomingTokens] = useState<Record<string, number>>({});
  const [dynamicOutgoingTokens, setDynamicOutgoingTokens] = useState<Record<string, number>>({});

  // Update streaming amounts every second
  useEffect(() => {
    // Initialize with current values
    const initialIncoming = incomingStreams.reduce((acc, stream) => {
      acc[stream.token] = (acc[stream.token] || 0) + stream.totalStreamed - stream.totalWithdrawn;
      return acc;
    }, {} as Record<string, number>);
    
    const initialOutgoing = outgoingStreams.reduce((acc, stream) => {
      acc[stream.token] = (acc[stream.token] || 0) + stream.totalStreamed;
      return acc;
    }, {} as Record<string, number>);
    
    setDynamicIncomingTokens(initialIncoming);
    setDynamicOutgoingTokens(initialOutgoing);
    
    // Update every second
    const interval = setInterval(() => {
      setDynamicIncomingTokens(prev => {
        const updated = { ...prev };
        incomingStreams.forEach(stream => {
          if (stream.active) {
            updated[stream.token] = (updated[stream.token] || 0) + stream.amountPerSecond;
          }
        });
        return updated;
      });
      
      setDynamicOutgoingTokens(prev => {
        const updated = { ...prev };
        outgoingStreams.forEach(stream => {
          if (stream.active) {
            updated[stream.token] = (updated[stream.token] || 0) + stream.amountPerSecond;
          }
        });
        return updated;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [incomingStreams, outgoingStreams]);
  
  // Get the recent activity (both vaults and streams)
  const recentVaults = userVaults.slice(0, 2);
  const recentStreams = mockStreams.slice(0, 2);
  
  // Get total count of active streams
  const activeStreamsCount = mockStreams.filter(s => s.active).length;

  // Calculate available to withdraw for each token type
  const availableToWithdraw = incomingStreams.reduce((acc, stream) => {
    const availableAmount = stream.totalStreamed - stream.totalWithdrawn;
    acc[stream.token] = (acc[stream.token] || 0) + availableAmount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="pt-20 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <section className="page-transition mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Manage your payment vaults and streams
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-end gap-2">
              <div className="flex gap-2">
                <CreateVaultDialog />
                <CreateStreamDialog />
              </div>
            </div>
          </div>
          
          {/* Stats Cards */}
          <StatsSection 
            userVaults={userVaults}
            vaultTokens={vaultTokens}
            activeStreamsCount={activeStreamsCount}
            dynamicOutgoingTokens={dynamicOutgoingTokens}
            dynamicIncomingTokens={dynamicIncomingTokens}
            availableToWithdraw={availableToWithdraw}
          />
          
          {/* Incoming Streams */}
          <StreamsSection 
            streams={incomingStreams} 
            title="Incoming Streams" 
            linkTo="/streams?tab=incoming" 
            isReceiving={true} 
          />
          
          {/* Recent Activity */}
          <RecentActivity 
            recentVaults={recentVaults}
            recentStreams={recentStreams}
            walletAddress={mockWallet.address}
          />
        </section>
      </main>
    </div>
  );
};

export default Index;
