
import { ArrowDownUp } from "lucide-react";
import { formatCurrency } from "@/lib/types";
import { StatsCard, TokenDisplay } from "./stats-card";

interface StreamsCardProps {
  activeStreamsCount: number;
  dynamicOutgoingTokens: Record<string, number>;
  dynamicIncomingTokens: Record<string, number>;
}

export function StreamsCard({ 
  activeStreamsCount, 
  dynamicOutgoingTokens, 
  dynamicIncomingTokens 
}: StreamsCardProps) {
  return (
    <StatsCard
      title="Active Streams"
      icon={<ArrowDownUp className="h-5 w-5 text-primary" />}
      count={activeStreamsCount}
      linkText="View all streams"
      linkTo="/streams"
    >
      {Object.entries(dynamicOutgoingTokens).length > 0 && (
        <>
          <div className="text-xs text-muted-foreground mb-1">Paying out:</div>
          {Object.entries(dynamicOutgoingTokens).map(([token, amount]) => (
            <TokenDisplay 
              key={`out-${token}`} 
              token={token} 
              amount={formatCurrency(amount)} 
            />
          ))}
        </>
      )}
      
      {Object.entries(dynamicIncomingTokens).length > 0 && (
        <>
          <div className="text-xs text-muted-foreground mt-3 mb-1">Receiving:</div>
          {Object.entries(dynamicIncomingTokens).map(([token, amount]) => (
            <TokenDisplay 
              key={`in-${token}`} 
              token={token} 
              amount={formatCurrency(amount)} 
            />
          ))}
        </>
      )}
    </StatsCard>
  );
}
