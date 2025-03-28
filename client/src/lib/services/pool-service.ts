
import { Pool, mockPools } from "../types";
import { getApiConfig, mockDelay } from "../api-client";

// Local mutable copy of mockPools for the mock implementation
let localMockPools = [...mockPools];

export const poolService = {
  /**
   * Get all pools
   */
  getPools: async (): Promise<Pool[]> => {
    const config = getApiConfig();
    
    if (config.useMock) {
      await mockDelay();
      return [...localMockPools];
    } else {
      // Here you would call your smart contract
      // Example: const pools = await contract.getAllPools();
      throw new Error("Smart contract integration not implemented yet");
    }
  },
  
  /**
   * Get a specific pool by ID
   */
  getPoolById: async (id: string): Promise<Pool | null> => {
    const config = getApiConfig();
    
    if (config.useMock) {
      await mockDelay();
      const pool = localMockPools.find(p => p.id === id);
      return pool ? { ...pool } : null;
    } else {
      // Example: const pool = await contract.getPoolById(id);
      throw new Error("Smart contract integration not implemented yet");
    }
  },
  
  /**
   * Create a new pool
   */
  createPool: async (pool: Omit<Pool, "id" | "createdAt" | "streams">): Promise<Pool> => {
    const config = getApiConfig();
    
    if (config.useMock) {
      await mockDelay();
      const newPool: Pool = {
        id: `pool-${localMockPools.length + 1}`,
        createdAt: new Date().toISOString(),
        streams: [],
        ...pool
      };
      
      localMockPools.push(newPool);
      return { ...newPool };
    } else {
      // Example: const newPool = await contract.createPool(pool);
      throw new Error("Smart contract integration not implemented yet");
    }
  },
  
  /**
   * Update a pool
   */
  updatePool: async (id: string, updates: Partial<Pool>): Promise<Pool> => {
    const config = getApiConfig();
    
    if (config.useMock) {
      await mockDelay();
      const index = localMockPools.findIndex(p => p.id === id);
      
      if (index === -1) {
        throw new Error(`Pool with ID ${id} not found`);
      }
      
      const updatedPool = {
        ...localMockPools[index],
        ...updates
      };
      
      localMockPools[index] = updatedPool;
      return { ...updatedPool };
    } else {
      // Example: const updatedPool = await contract.updatePool(id, updates);
      throw new Error("Smart contract integration not implemented yet");
    }
  },
  
  /**
   * Delete a pool
   */
  deletePool: async (id: string): Promise<boolean> => {
    const config = getApiConfig();
    
    if (config.useMock) {
      await mockDelay();
      const initialLength = localMockPools.length;
      localMockPools = localMockPools.filter(p => p.id !== id);
      
      return localMockPools.length !== initialLength;
    } else {
      // Example: const success = await contract.deletePool(id);
      throw new Error("Smart contract integration not implemented yet");
    }
  },
  
  /**
   * Add credit to a pool
   */
  addCredit: async (id: string, amount: number): Promise<Pool> => {
    const config = getApiConfig();
    
    if (config.useMock) {
      await mockDelay();
      const index = localMockPools.findIndex(p => p.id === id);
      
      if (index === -1) {
        throw new Error(`Pool with ID ${id} not found`);
      }
      
      const updatedPool = {
        ...localMockPools[index],
        balance: localMockPools[index].balance + amount
      };
      
      localMockPools[index] = updatedPool;
      return { ...updatedPool };
    } else {
      // Example: const updatedPool = await contract.addCredit(id, amount);
      throw new Error("Smart contract integration not implemented yet");
    }
  },
  
  /**
   * Drain funds from a pool
   */
  drainPool: async (id: string, amount: number): Promise<Pool> => {
    const config = getApiConfig();
    
    if (config.useMock) {
      await mockDelay();
      const index = localMockPools.findIndex(p => p.id === id);
      
      if (index === -1) {
        throw new Error(`Pool with ID ${id} not found`);
      }
      
      if (localMockPools[index].balance < amount) {
        throw new Error(`Insufficient funds in pool. Available: ${localMockPools[index].balance}`);
      }
      
      const updatedPool = {
        ...localMockPools[index],
        balance: localMockPools[index].balance - amount
      };
      
      localMockPools[index] = updatedPool;
      return { ...updatedPool };
    } else {
      // Example: const updatedPool = await contract.drainPool(id, amount);
      throw new Error("Smart contract integration not implemented yet");
    }
  }
};
