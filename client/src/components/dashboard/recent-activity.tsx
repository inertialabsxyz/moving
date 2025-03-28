
import { Button } from "@/components/ui/button";
import { VaultCard } from "@/components/vault-card.tsx";
import { StreamCard } from "@/components/stream-card";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Vault, Stream } from "@/lib/types";

interface RecentActivityProps {
  recentVaults: Vault[];
  recentStreams: Stream[];
  walletAddress: string;
}

export function RecentActivity({ recentVaults, recentStreams, walletAddress }: RecentActivityProps) {
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
        {recentStreams.map((stream) => (
          <StreamCard 
            key={stream.id} 
            stream={stream} 
            isReceiving={stream.destination === walletAddress}
          />
        ))}
      </div>
    </div>
  );
}
