
import { useQuery } from "@tanstack/react-query";
import { poolService } from "@/lib/services";
import { Pool } from "@/lib/types";

export function usePoolsQuery() {
  return useQuery({
    queryKey: ["pools"],
    queryFn: () => poolService.getPools(),
  });
}

export function usePoolQuery(id: string | undefined) {
  return useQuery({
    queryKey: ["pool", id],
    queryFn: () => id ? poolService.getPoolById(id) : Promise.resolve(null),
    enabled: !!id,
  });
}
