
import { useQuery } from "@tanstack/react-query";
import { walletService } from "@/lib/services";
import { useWalletContext } from "@/context/WalletContext";

export function useWalletQuery() {
  const { currentWallet, connected } = useWalletContext();
  
  return useQuery({
    queryKey: ["wallet", connected, currentWallet.address],
    queryFn: () => walletService.getCurrentWallet(),
    initialData: currentWallet,
  });
}
