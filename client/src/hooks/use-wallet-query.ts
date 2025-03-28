
import { useQuery } from "@tanstack/react-query";
import { walletService } from "@/lib/services";

export function useWalletQuery() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: () => walletService.getCurrentWallet(),
  });
}
