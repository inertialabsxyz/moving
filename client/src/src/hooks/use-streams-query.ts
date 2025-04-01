
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
    // Add a staleTime of 0 to ensure immediate refetch when stream is cancelled
    staleTime: 0
  });
}

export function useStreamQuery(id: string | undefined) {
  return useQuery({
    queryKey: ["stream", id],
    queryFn: () => id ? streamService.getStreamById(id) : Promise.resolve(null),
    enabled: !!id,
  });
}
