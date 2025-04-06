
import { Navigation } from "@/components/navigation";
import { WalletButton } from "@/components/wallet/wallet-button";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useWalletQuery } from "@/hooks/use-wallet-query";
import { useApi } from "@/context/ApiContext";
import { useWalletContext } from "@/context/WalletContext";
import { useVaultsQuery } from "@/hooks/use-vaults-query";
import { mockWallet } from "@/lib/types";
import { StatsSection } from "@/components/dashboard/stats-section";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StreamsSection } from "@/components/dashboard/streams-section";
import { useStreamsQuery } from "@/hooks/use-streams-query";
import { useMemo } from "react";
import { CreateVaultDialog } from "@/components/create-vault-dialog";
import { CreateStreamDialog } from "@/components/create-stream-dialog";

const Index = () => {
  const { refreshWallet, isRefetching } = useWalletQuery();
  const { apiConfig } = useApi();
  const { currentWallet } = useWalletContext();
  const { data: vaults = [], isLoading: vaultsLoading } = useVaultsQuery();
  const { data: streams = [], isLoading: streamsLoading } = useStreamsQuery();
  
  // Filter vaults owned by the current user
  const userVaults = useMemo(() => {
    return vaults.filter(vault => vault.owner === currentWallet.address);
  }, [vaults, currentWallet.address]);
  
  // Calculate total funds in vaults by token
  const vaultTokens = useMemo(() => {
    const tokens: Record<string, number> = {};
    userVaults.forEach(vault => {
      const token = vault.token;
      tokens[token] = (tokens[token] || 0) + vault.balance;
    });
    return tokens;
  }, [userVaults]);
  
  // Calculate withdrawable funds
  const availableToWithdraw = useMemo(() => {
    const tokens: Record<string, number> = {};
    streams
      .filter(stream => 
        stream.destination === currentWallet.address && 
        stream.totalWithdrawn < stream.totalStreamed
      )
      .forEach(stream => {
        const token = stream.token;
        // Only count what's available based on stream progress
        const availableAmount = stream.totalStreamed - stream.totalWithdrawn;
        tokens[token] = (tokens[token] || 0) + availableAmount;
      });
    return tokens;
  }, [streams, currentWallet.address]);
  
  // Recent vaults (up to 3)
  const recentVaults = useMemo(() => {
    return [...userVaults]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [userVaults]);
  
  // Outgoing streams (user is source)
  const outgoingStreams = useMemo(() => {
    return streams
      .filter(stream => stream.source === currentWallet.address)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [streams, currentWallet.address]);
  
  // Incoming streams (user is destination)
  const incomingStreams = useMemo(() => {
    return streams
      .filter(stream => stream.destination === currentWallet.address)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [streams, currentWallet.address]);
  
  // Calculate stream stats for the StreamsCard component
  const { 
    activeStreamsCount, 
    dynamicOutgoingTokens, 
    dynamicIncomingTokens 
  } = useMemo(() => {
    // Active streams filtering
    const activeStreams = streams.filter(stream => stream.active);
    
    // Filter by outgoing/incoming
    const outgoingStreams = activeStreams.filter(
      stream => stream.source === currentWallet.address
    );
    
    const incomingStreams = activeStreams.filter(
      stream => stream.destination === currentWallet.address
    );
    
    // Group by token and sum amounts
    const outgoingTokens: Record<string, number> = {};
    const incomingTokens: Record<string, number> = {};
    
    outgoingStreams.forEach(stream => {
      const hourlyRate = stream.amountPerSecond * 3600;
      outgoingTokens[stream.token] = (outgoingTokens[stream.token] || 0) + hourlyRate;
    });
    
    incomingStreams.forEach(stream => {
      const hourlyRate = stream.amountPerSecond * 3600;
      incomingTokens[stream.token] = (incomingTokens[stream.token] || 0) + hourlyRate;
    });
    
    return {
      activeStreamsCount: activeStreams.length,
      dynamicOutgoingTokens: outgoingTokens,
      dynamicIncomingTokens: incomingTokens
    };
  }, [streams, currentWallet.address]);
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Overview of your payment streams and vaults
              </p>
            </div>
            
            <div className="flex items-center gap-3 mt-4 md:mt-0">
              <CreateVaultDialog />
              <CreateStreamDialog />
            </div>
          </div>
          
          <StatsSection 
            userVaults={userVaults}
            vaultTokens={vaultTokens}
            availableToWithdraw={availableToWithdraw}
            activeStreamsCount={activeStreamsCount}
            dynamicOutgoingTokens={dynamicOutgoingTokens}
            dynamicIncomingTokens={dynamicIncomingTokens}
          />
          
          <StreamsSection
            streams={outgoingStreams}
            title="Outgoing Streams"
            linkTo="/streams?tab=outgoing"
            isLoading={streamsLoading}
          />
          
          <StreamsSection
            streams={incomingStreams}
            title="Incoming Streams"
            linkTo="/streams?tab=incoming"
            isReceiving={true}
            isLoading={streamsLoading}
          />
          
          <RecentActivity 
            recentVaults={recentVaults} 
            walletAddress={currentWallet.address}
            recentStreams={[...outgoingStreams, ...incomingStreams].slice(0, 3)}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
