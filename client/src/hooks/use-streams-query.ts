
import { useQuery } from "@tanstack/react-query";
import { streamService } from "@/lib/services";
import { Stream } from "@/lib/types";

export function useStreamsQuery() {
  return useQuery({
    queryKey: ["streams"],
    queryFn: () => streamService.getStreams(),
  });
}

export function usePoolStreamsQuery(poolId: string | undefined) {
  return useQuery({
    queryKey: ["streams", "pool", poolId],
    queryFn: () => poolId ? streamService.getStreamsByPoolId(poolId) : Promise.resolve([]),
    enabled: !!poolId,
  });
}

export function useStreamQuery(id: string | undefined) {
  return useQuery({
    queryKey: ["stream", id],
    queryFn: () => id ? streamService.getStreamById(id) : Promise.resolve(null),
    enabled: !!id,
  });
}
