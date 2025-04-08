
import { useQuery } from "@tanstack/react-query";
import { useStreamService } from "@/lib/services";
import { Stream } from "@/lib/types";

export function useStreamsQuery() {
  const { getStreams } = useStreamService();
  return useQuery({
    queryKey: ["streams"],
    queryFn: () => getStreams(),
  });
}

export function useVaultStreamsQuery(vaultId: string | undefined) {
  const { getStreamsByVaultId } = useStreamService();
  return useQuery({
    queryKey: ["streams", "vault", vaultId],
    queryFn: () => vaultId ? getStreamsByVaultId(vaultId) : Promise.resolve([]),
    enabled: !!vaultId,
    // Add a staleTime of 0 to ensure immediate refetch when stream is cancelled
    staleTime: 0
  });
}

export function useStreamQuery(id: string | undefined) {
  const { getStreamById } = useStreamService();
  return useQuery({
    queryKey: ["stream", id],
    queryFn: () => id ? getStreamById(id) : Promise.resolve(null),
    enabled: !!id,
  });
}
