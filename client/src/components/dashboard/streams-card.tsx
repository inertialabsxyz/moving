
import { ArrowDownUp } from "lucide-react";
import { formatCurrency, mockWallet } from "@/lib/types";
import { StatsCard } from "./stats-card";
import { TokenIcon } from "@/components/ui/token-icon";
import { useStreamsQuery } from "@/hooks/use-streams-query";
import { useMemo } from "react";

export function StreamsCard() {
  const { data: streams = [], isLoading } = useStreamsQuery();
  
  // Calculate active streams and categorize them
  const { 
    activeStreamsCount, 
    dynamicOutgoingTokens, 
    dynamicIncomingTokens 
  } = useMemo(() => {
    // Active streams filtering
    const activeStreams = streams.filter(stream => stream.active);
    
    // Filter by outgoing/incoming
    const outgoingStreams = activeStreams.filter(
      stream => stream.source === mockWallet.address
    );
    
    const incomingStreams = activeStreams.filter(
      stream => stream.destination === mockWallet.address
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
  }, [streams]);

  return (
    <StatsCard
      title="Active Streams"
      icon={<ArrowDownUp className="h-5 w-5 text-primary" />}
      count={isLoading ? "..." : activeStreamsCount}
      linkText="View all streams"
      linkTo="/streams"
    >
      {isLoading ? (
        <div className="text-sm text-muted-foreground">
          Loading stream data...
        </div>
      ) : (
        <>
          {Object.entries(dynamicOutgoingTokens).length > 0 && (
            <>
              <div className="text-xs text-muted-foreground mb-1">Paying out:</div>
              {Object.entries(dynamicOutgoingTokens).map(([token, amount]) => (
                <div key={`out-${token}`} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{formatCurrency(amount)}</span>
                  <div className="flex items-center gap-1.5">
                    <TokenIcon token={token} />
                    <span>{token}</span>
                  </div>
                </div>
              ))}
            </>
          )}
          
          {Object.entries(dynamicIncomingTokens).length > 0 && (
            <>
              <div className="text-xs text-muted-foreground mt-3 mb-1">Receiving:</div>
              {Object.entries(dynamicIncomingTokens).map(([token, amount]) => (
                <div key={`in-${token}`} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{formatCurrency(amount)}</span>
                  <div className="flex items-center gap-1.5">
                    <TokenIcon token={token} />
                    <span>{token}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </StatsCard>
  );
}
