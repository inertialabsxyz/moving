
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vaultService } from "@/lib/services";
import { Vault } from "@/lib/types";
import { toast } from "sonner";

export function useCreateVaultMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (vaultData: Omit<Vault, "id" | "createdAt" | "streams">) =>
      vaultService.createVault(vaultData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaults"] });
      toast.success("Vault created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create vault: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });
}

export function useUpdateVaultMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Vault> }) =>
      vaultService.updateVault(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["vaults"] });
      queryClient.invalidateQueries({ queryKey: ["vault", data.id] });
      toast.success("Vault updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update vault: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });
}

export function useDeleteVaultMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => vaultService.deleteVault(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["vaults"] });
      queryClient.removeQueries({ queryKey: ["vault", id] });
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
      vaultService.addCredit(id, amount),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["vaults"] });
      queryClient.invalidateQueries({ queryKey: ["vault", data.id] });
      toast.success(`Successfully added credit to vault`);
    },
    onError: (error) => {
      toast.error(`Failed to add credit: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });
}

export function useDrainVaultMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => 
      vaultService.drainVault(id, amount),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["vaults"] });
      queryClient.invalidateQueries({ queryKey: ["vault", data.id] });
      toast.success(`Successfully drained ${data.token} from vault`);
    },
    onError: (error) => {
      toast.error(`Failed to drain vault: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });
}
