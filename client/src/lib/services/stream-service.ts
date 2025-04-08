
import { Stream, mockStreams } from "../types";
import { getApiConfig, mockDelay } from "../api-client";
import { useMemo } from "react";
import {useVaultService} from "@/lib/services/vault-service.ts";

// Local mutable copy for mock implementation
const localMockStreams = [...mockStreams];

export const useStreamService = () => {
  const config = useMemo(() => getApiConfig(), []);
  /**
   * Get all streams
   */
  const getStreams = async (): Promise<Stream[]> => {
    if (config.useMock) {
      await mockDelay();
      // Filter out inactive streams
      return [...localMockStreams].filter(stream => stream.active);
    } else {
      // Example: const streams = await contract.getAllStreams();
      throw new Error("Smart contract integration not implemented yet");
    }
  };
  
  /**
   * Get streams for a specific vault
   */
  const getStreamsByVaultId = async (vaultId: string): Promise<Stream[]> => {
    if (config.useMock) {
      await mockDelay();
      // Filter out inactive streams - ensure we're only returning active streams
      return localMockStreams
        .filter(s => s.vaultId === vaultId && s.active)
        .map(s => ({ ...s }));
    } else {
      // Example: const streams = await contract.getStreamsByVaultId(vaultId);
      throw new Error("Smart contract integration not implemented yet");
    }
  };
  
  /**
   * Get a specific stream by ID
   */
  const getStreamById = async (id: string): Promise<Stream | null> => {
    if (config.useMock) {
      await mockDelay();
      const stream = localMockStreams.find(s => s.id === id);
      return stream ? { ...stream } : null;
    } else {
      // Example: const stream = await contract.getStreamById(id);
      throw new Error("Smart contract integration not implemented yet");
    }
  };
  
  /**
   * Create a new stream
   */
  const createStream = async (stream: Omit<Stream, "id" | "createdAt" | "totalStreamed" | "totalWithdrawn">): Promise<Stream> => {
    if (config.useMock) {
      await mockDelay();
      
      // Get the vault to associate with this stream
      // const vault = await vaultService.getVaultsById(stream.vaultId);
      // if (!vault) {
      //   throw new Error(`Vault with ID ${stream.vaultId} not found`);
      // }
      //
      const newStream: Stream = {
        id: `stream-${localMockStreams.length + 1}`,
        createdAt: new Date().toISOString(),
        totalStreamed: 0,
        totalWithdrawn: 0,
        ...stream
      };
      
      localMockStreams.push(newStream);
      
      // Add stream to vault too
      // const updatedVaultStreams = [...vault.streams, newStream];
      // await vaultService.updateVault(vault.id, { streams: updatedVaultStreams });
      //
      return { ...newStream };
    } else {
      // Example: const newStream = await contract.createStream(stream);
      throw new Error("Smart contract integration not implemented yet");
    }
  };
  
  /**
   * Update a stream
   */
  const updateStream = async (id: string, updates: Partial<Stream>): Promise<Stream> => {
    if (config.useMock) {
      await mockDelay();
      const index = localMockStreams.findIndex(s => s.id === id);
      
      if (index === -1) {
        throw new Error(`Stream with ID ${id} not found`);
      }
      
      const updatedStream = {
        ...localMockStreams[index],
        ...updates
      };
      
      localMockStreams[index] = updatedStream;
      
      // If this stream is part of a vault, update the vault's stream list too
      // const vault = await vaultService.getVaultsById(updatedStream.vaultId);
      // if (vault) {
      //   const updatedVaultStreams = vault.streams.map(s =>
      //     s.id === id ? updatedStream : s
      //   );
      //   await vaultService.updateVault(vault.id, { streams: updatedVaultStreams });
      // }
      
      return { ...updatedStream };
    } else {
      // Example: const updatedStream = await contract.updateStream(id, updates);
      throw new Error("Smart contract integration not implemented yet");
    }
  };
  
  /**
   * Cancel a stream
   */
  const cancelStream = async (id: string): Promise<Stream> => {
    if (config.useMock) {
      await mockDelay();
      const index = localMockStreams.findIndex(s => s.id === id);
      
      if (index === -1) {
        throw new Error(`Stream with ID ${id} not found`);
      }
      
      const updatedStream = {
        ...localMockStreams[index],
        active: false
      };
      
      localMockStreams[index] = updatedStream;
      
      // Make sure to update the vault's stream too
      // const vault = await vaultService.getVaultsById(updatedStream.vaultId);
      // if (vault) {
      //   const updatedVaultStreams = vault.streams.map(s =>
      //     s.id === id ? { ...s, active: false } : s
      //   );
      //   await vaultService.updateVault(vault.id, { streams: updatedVaultStreams });
      // }
      
      return { ...updatedStream };
    } else {
      // Example: const cancelledStream = await contract.cancelStream(id);
      throw new Error("Smart contract integration not implemented yet");
    }
  };
  
  /**
   * Withdraw funds from a stream
   */
  const withdrawFromStream = async (id: string, amount: number): Promise<Stream> => {
    const config = getApiConfig();
    
    if (config.useMock) {
      await mockDelay();
      const index = localMockStreams.findIndex(s => s.id === id);
      
      if (index === -1) {
        throw new Error(`Stream with ID ${id} not found`);
      }
      
      const stream = localMockStreams[index];
      const availableToWithdraw = stream.totalStreamed - stream.totalWithdrawn;
      
      if (amount > availableToWithdraw) {
        throw new Error(`Insufficient funds to withdraw. Available: ${availableToWithdraw}`);
      }
      
      const updatedStream = {
        ...stream,
        totalWithdrawn: stream.totalWithdrawn + amount
      };
      
      localMockStreams[index] = updatedStream;
      
      // Update in the vault too
      // const vault = await vaultService.getVaultsById(updatedStream.vaultId);
      // if (vault) {
      //   const updatedVaultStreams = vault.streams.map(s =>
      //     s.id === id ? updatedStream : s
      //   );
      //   await vaultService.updateVault(vault.id, { streams: updatedVaultStreams });
      // }
      
      return { ...updatedStream };
    } else {
      // Example: const updatedStream = await contract.withdrawFromStream(id, amount);
      throw new Error("Smart contract integration not implemented yet");
    }
  };

  return {
    getStreams,
    getStreamsByVaultId,
    getStreamById,
    createStream,
    updateStream,
    cancelStream,
    withdrawFromStream,
  }
};
