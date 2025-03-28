
import { useQuery } from "@tanstack/react-query";
import { streamService } from "@/lib/services";
import { Stream } from "@/lib/types";

export function useStreamsQuery() {
  return useQuery({
    queryKey: ["streams"],
    queryFn: () => streamService.getStreams(),
  });
}

export function useVaultStreamsQuery(vaultId: string | undefined) {
  return useQuery({
    queryKey: ["streams", "vault", vaultId],
    queryFn: () => vaultId ? streamService.getStreamsByVaultId(vaultId) : Promise.resolve([]),
    enabled: !!vaultId,
  });
}

export function useStreamQuery(id: string | undefined) {
  return useQuery({
    queryKey: ["stream", id],
    queryFn: () => id ? streamService.getStreamById(id) : Promise.resolve(null),
    enabled: !!id,
  });
}
