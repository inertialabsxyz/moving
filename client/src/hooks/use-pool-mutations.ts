
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { poolService } from "@/lib/services";
import { Pool } from "@/lib/types";
import { toast } from "sonner";

export function useCreatePoolMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (poolData: Omit<Pool, "id" | "createdAt" | "streams">) => 
      poolService.createPool(poolData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pools"] });
      toast.success("Vault created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create vault: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });
}

export function useUpdatePoolMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Pool> }) => 
      poolService.updatePool(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pools"] });
      queryClient.invalidateQueries({ queryKey: ["pool", data.id] });
      toast.success("Vault updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update vault: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });
}

export function useDeletePoolMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => poolService.deletePool(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["pools"] });
      queryClient.removeQueries({ queryKey: ["pool", id] });
      toast.success("Vault deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete vault: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });
}

export function useAddCreditMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => 
      poolService.addCredit(id, amount),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pools"] });
      queryClient.invalidateQueries({ queryKey: ["pool", data.id] });
      toast.success(`Successfully added credit to vault`);
    },
    onError: (error) => {
      toast.error(`Failed to add credit: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });
}

export function useDrainPoolMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => 
      poolService.drainPool(id, amount),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pools"] });
      queryClient.invalidateQueries({ queryKey: ["pool", data.id] });
      toast.success(`Successfully drained ${data.token} from vault`);
    },
    onError: (error) => {
      toast.error(`Failed to drain vault: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });
}
