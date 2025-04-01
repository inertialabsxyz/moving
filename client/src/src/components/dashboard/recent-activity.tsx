
import { Button } from "@/components/ui/button";
import { VaultCard } from "@/components/vault-card.tsx";
import { StreamCard } from "@/components/stream-card";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Vault, Stream } from "@/lib/types";
import { useStreamsQuery } from "@/hooks/use-streams-query";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentActivityProps {
  recentVaults: Vault[];
  walletAddress: string;
  // Add the missing prop
  recentStreams?: Stream[];
}

export function RecentActivity({ recentVaults, walletAddress, recentStreams }: RecentActivityProps) {
  const { data: allStreams = [], isLoading } = useStreamsQuery();
  
  // Get most recent streams (up to 3) - prioritize passed streams if available
  const displayStreams = recentStreams || [...allStreams]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Recent Activity</h2>
        <Button variant="ghost" asChild>
          <Link to="/vaults" className="gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recentVaults.map((vault) => (
          <VaultCard key={vault.id} vault={vault} />
        ))}
        
        {isLoading ? (
          [1, 2].map((i) => (
            <div key={`skeleton-${i}`} className="p-6 rounded-lg border">
              <Skeleton className="h-6 w-1/2 mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <div className="flex justify-between">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-5 w-1/4" />
              </div>
            </div>
          ))
        ) : (
          displayStreams.map((stream) => (
            <StreamCard 
              key={stream.id} 
              stream={stream} 
              isReceiving={stream.destination === walletAddress}
            />
          ))
        )}
      </div>
    </div>
  );
}
