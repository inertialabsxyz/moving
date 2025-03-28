
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { streamService } from "@/lib/services";
import { Stream } from "@/lib/types";
import { toast } from "sonner";

export function useCreateStreamMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (streamData: Omit<Stream, "id" | "createdAt" | "totalStreamed" | "totalWithdrawn">) => 
      streamService.createStream(streamData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["streams"] });
      queryClient.invalidateQueries({ queryKey: ["streams", "vault", data.vaultId] });
      queryClient.invalidateQueries({ queryKey: ["vault", data.vaultId] });
      toast.success("Stream created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create stream: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });
}

export function useUpdateStreamMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Stream> }) => 
      streamService.updateStream(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["streams"] });
      queryClient.invalidateQueries({ queryKey: ["stream", data.id] });
      queryClient.invalidateQueries({ queryKey: ["streams", "vault", data.vaultId] });
      queryClient.invalidateQueries({ queryKey: ["vault", data.vaultId] });
      toast.success("Stream updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update stream: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });
}

export function useCancelStreamMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => streamService.cancelStream(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["streams"] });
      queryClient.invalidateQueries({ queryKey: ["stream", data.id] });
      queryClient.invalidateQueries({ queryKey: ["streams", "vault", data.vaultId] });
      queryClient.invalidateQueries({ queryKey: ["vault", data.vaultId] });
      toast.success("Stream cancelled successfully");
    },
    onError: (error) => {
      toast.error(`Failed to cancel stream: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });
}

export function useWithdrawFromStreamMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => 
      streamService.withdrawFromStream(id, amount),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["streams"] });
      queryClient.invalidateQueries({ queryKey: ["stream", data.id] });
      queryClient.invalidateQueries({ queryKey: ["streams", "vault", data.vaultId] });
      toast.success(`Successfully withdrew from stream`);
    },
    onError: (error) => {
      toast.error(`Failed to withdraw: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });
}
