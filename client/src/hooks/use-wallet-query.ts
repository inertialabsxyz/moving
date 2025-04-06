
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { walletService } from "@/lib/services";
import { useWalletContext } from "@/context/WalletContext";
import { useApi } from "@/context/ApiContext";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

export function useWalletQuery(options = {}) {
  const { currentWallet, connected } = useWalletContext();
  const queryClient = useQueryClient();
  const { apiConfig } = useApi();
  
  // Define a consistent query key that includes both connected state and address
  const walletQueryKey = ["wallet", connected, currentWallet.address];
  
  const query = useQuery({
    queryKey: walletQueryKey,
    queryFn: async () => {
      console.log("Wallet query function running, connected:", connected);
      if (apiConfig.useMock) {
        return { address: '', isCurrentUser: false, balances: {} };
      } else {
        return { address: '', isCurrentUser: false, balances: {} };
        // return await walletService.getCurrentWallet(config, currentWallet.address);
      }
    },
    initialData: currentWallet,
    // Only apply automatic refreshing in real mode (not mock mode)
    refetchInterval: apiConfig.useMock ? false : 30000,
    // Only automatically refetch on window focus in real mode
    refetchOnWindowFocus: !apiConfig.useMock,
    // Don't refetch on mount if we already have data (in mock mode)
    refetchOnMount: apiConfig.useMock ? false : "always",
    // Don't throw wallet connection errors since they're expected when wallet is not connected
    retry: false,
    ...options
  });

  // Function to manually invalidate the wallet query
  const refreshWallet = () => {
    queryClient.invalidateQueries({ queryKey: walletQueryKey });
  };
  
  return {
    ...query,
    refreshWallet
  };
}

// Export a utility function to invalidate wallet query from anywhere
export function invalidateWalletQuery(queryClient) {
  queryClient.invalidateQueries({ queryKey: ["wallet"] });
}
