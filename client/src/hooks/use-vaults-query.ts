
import { useQuery } from "@tanstack/react-query";
import { useVaultService } from "@/lib/services";
import { Vault } from "@/lib/types";

export function useVaultsQuery() {
  const {getVaults} = useVaultService();
  return useQuery({
    queryKey: ["vaults"],
    queryFn: () => getVaults(),
  });
}

export function useVaultQuery(id: string | undefined) {
  const {getVaultsById} = useVaultService();
  return useQuery({
    queryKey: ["vault", id],
    queryFn: () => id ? getVaultsById(id) : Promise.resolve(null),
    enabled: !!id,
  });
}
