
import { useQuery } from "@tanstack/react-query";
import { vaultService } from "@/lib/services";
import { Vault } from "@/lib/types";

export function useVaultsQuery() {
  return useQuery({
    queryKey: ["vaults"],
    queryFn: () => vaultService.getVaults(),
  });
}

export function useVaultQuery(id: string | undefined) {
  return useQuery({
    queryKey: ["vault", id],
    queryFn: () => id ? vaultService.getVaultsById(id) : Promise.resolve(null),
    enabled: !!id,
  });
}
