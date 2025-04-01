
import { VaultsCard } from "./vaults-card.tsx";
import { StreamsCard } from "./streams-card";
import { WithdrawableCard } from "./withdrawable-card";
import { Vault } from "@/lib/types";

interface StatsSectionProps {
  userVaults: Vault[];
  vaultTokens: Record<string, number>;
  availableToWithdraw: Record<string, number>;
  // Add the missing props
  activeStreamsCount?: number;
  dynamicOutgoingTokens?: Record<string, number>;
  dynamicIncomingTokens?: Record<string, number>;
}

export function StatsSection({
  userVaults,
  vaultTokens,
  availableToWithdraw,
  // Add the missing props with defaults
  activeStreamsCount,
  dynamicOutgoingTokens,
  dynamicIncomingTokens,
}: StatsSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <VaultsCard userVaults={userVaults} vaultTokens={vaultTokens} />
      <StreamsCard />
      <WithdrawableCard availableToWithdraw={availableToWithdraw} />
    </div>
  );
}
