
import { VaultsCard } from "./vaults-card.tsx";
import { StreamsCard } from "./streams-card";
import { WithdrawableCard } from "./withdrawable-card";

interface StatsSectionProps {
  userVaults: never;
  vaultTokens: Record<string, number>;
  activeStreamsCount: number;
  dynamicOutgoingTokens: Record<string, number>;
  dynamicIncomingTokens: Record<string, number>;
  availableToWithdraw: Record<string, number>;
}

export function StatsSection({
  userVaults,
  vaultTokens,
  activeStreamsCount,
  dynamicOutgoingTokens,
  dynamicIncomingTokens,
  availableToWithdraw,
}: StatsSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <VaultsCard userVaults={userVaults} vaultTokens={vaultTokens} />
      <StreamsCard 
        activeStreamsCount={activeStreamsCount}
        dynamicOutgoingTokens={dynamicOutgoingTokens}
        dynamicIncomingTokens={dynamicIncomingTokens}
      />
      <WithdrawableCard availableToWithdraw={availableToWithdraw} />
    </div>
  );
}
