
import { Stream, mockStreams } from "../types";
import { getApiConfig, mockDelay } from "../api-client";
import { poolService } from "./pool-service";

// Local mutable copy for mock implementation
let localMockStreams = [...mockStreams];

export const streamService = {
  /**
   * Get all streams
   */
  getStreams: async (): Promise<Stream[]> => {
    const config = getApiConfig();
    
    if (config.useMock) {
      await mockDelay();
      return [...localMockStreams];
    } else {
      // Example: const streams = await contract.getAllStreams();
      throw new Error("Smart contract integration not implemented yet");
    }
  },
  
  /**
   * Get streams for a specific pool
   */
  getStreamsByPoolId: async (poolId: string): Promise<Stream[]> => {
    const config = getApiConfig();
    
    if (config.useMock) {
      await mockDelay();
      return localMockStreams.filter(s => s.poolId === poolId).map(s => ({ ...s }));
    } else {
      // Example: const streams = await contract.getStreamsByPoolId(poolId);
      throw new Error("Smart contract integration not implemented yet");
    }
  },
  
  /**
   * Get a specific stream by ID
   */
  getStreamById: async (id: string): Promise<Stream | null> => {
    const config = getApiConfig();
    
    if (config.useMock) {
      await mockDelay();
      const stream = localMockStreams.find(s => s.id === id);
      return stream ? { ...stream } : null;
    } else {
      // Example: const stream = await contract.getStreamById(id);
      throw new Error("Smart contract integration not implemented yet");
    }
  },
  
  /**
   * Create a new stream
   */
  createStream: async (stream: Omit<Stream, "id" | "createdAt" | "totalStreamed" | "totalWithdrawn">): Promise<Stream> => {
    const config = getApiConfig();
    
    if (config.useMock) {
      await mockDelay();
      
      // Get the pool to associate with this stream
      const pool = await poolService.getPoolById(stream.poolId);
      if (!pool) {
        throw new Error(`Pool with ID ${stream.poolId} not found`);
      }
      
      const newStream: Stream = {
        id: `stream-${localMockStreams.length + 1}`,
        createdAt: new Date().toISOString(),
        totalStreamed: 0,
        totalWithdrawn: 0,
        ...stream
      };
      
      localMockStreams.push(newStream);
      
      // Add stream to pool too
      const updatedPoolStreams = [...pool.streams, newStream];
      await poolService.updatePool(pool.id, { streams: updatedPoolStreams });
      
      return { ...newStream };
    } else {
      // Example: const newStream = await contract.createStream(stream);
      throw new Error("Smart contract integration not implemented yet");
    }
  },
  
  /**
   * Update a stream
   */
  updateStream: async (id: string, updates: Partial<Stream>): Promise<Stream> => {
    const config = getApiConfig();
    
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
      
      // If this stream is part of a pool, update the pool's stream list too
      const pool = await poolService.getPoolById(updatedStream.poolId);
      if (pool) {
        const updatedPoolStreams = pool.streams.map(s => 
          s.id === id ? updatedStream : s
        );
        await poolService.updatePool(pool.id, { streams: updatedPoolStreams });
      }
      
      return { ...updatedStream };
    } else {
      // Example: const updatedStream = await contract.updateStream(id, updates);
      throw new Error("Smart contract integration not implemented yet");
    }
  },
  
  /**
   * Cancel a stream
   */
  cancelStream: async (id: string): Promise<Stream> => {
    const config = getApiConfig();
    
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
      
      // Update in the pool too
      const pool = await poolService.getPoolById(updatedStream.poolId);
      if (pool) {
        const updatedPoolStreams = pool.streams.map(s => 
          s.id === id ? updatedStream : s
        );
        await poolService.updatePool(pool.id, { streams: updatedPoolStreams });
      }
      
      return { ...updatedStream };
    } else {
      // Example: const cancelledStream = await contract.cancelStream(id);
      throw new Error("Smart contract integration not implemented yet");
    }
  },
  
  /**
   * Withdraw funds from a stream
   */
  withdrawFromStream: async (id: string, amount: number): Promise<Stream> => {
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
      
      // Update in the pool too
      const pool = await poolService.getPoolById(updatedStream.poolId);
      if (pool) {
        const updatedPoolStreams = pool.streams.map(s => 
          s.id === id ? updatedStream : s
        );
        await poolService.updatePool(pool.id, { streams: updatedPoolStreams });
      }
      
      return { ...updatedStream };
    } else {
      // Example: const updatedStream = await contract.withdrawFromStream(id, amount);
      throw new Error("Smart contract integration not implemented yet");
    }
  }
};
