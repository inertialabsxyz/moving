
import { PoolsCard } from "./pools-card";
import { StreamsCard } from "./streams-card";
import { WithdrawableCard } from "./withdrawable-card";

interface StatsSectionProps {
  userPools: any[];
  poolTokens: Record<string, number>;
  activeStreamsCount: number;
  dynamicOutgoingTokens: Record<string, number>;
  dynamicIncomingTokens: Record<string, number>;
  availableToWithdraw: Record<string, number>;
}

export function StatsSection({
  userPools,
  poolTokens,
  activeStreamsCount,
  dynamicOutgoingTokens,
  dynamicIncomingTokens,
  availableToWithdraw,
}: StatsSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <PoolsCard userPools={userPools} poolTokens={poolTokens} />
      <StreamsCard 
        activeStreamsCount={activeStreamsCount}
        dynamicOutgoingTokens={dynamicOutgoingTokens}
        dynamicIncomingTokens={dynamicIncomingTokens}
      />
      <WithdrawableCard availableToWithdraw={availableToWithdraw} />
    </div>
  );
}
