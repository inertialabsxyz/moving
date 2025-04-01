
import { Vault, mockVaults } from "../types";
import { getApiConfig, mockDelay } from "../api-client";

// Local mutable copy of mockVaults for the mock implementation
let localMockVaults = [...mockVaults];

export const vaultService = {
  /**
   * Get all vaults
   */
  getVaults: async (): Promise<Vault[]> => {
    const config = getApiConfig();
    
    if (config.useMock) {
      await mockDelay();
      return [...localMockVaults];
    } else {
      // Here you would call your smart contract
      // Example: const vaults = await contract.getAllVaults();
      throw new Error("Smart contract integration not implemented yet");
    }
  },
  
  /**
   * Get a specific vault by ID
   */
  getVaultsById: async (id: string): Promise<Vault | null> => {
    const config = getApiConfig();
    
    if (config.useMock) {
      await mockDelay();
      const vault = localMockVaults.find(p => p.id === id);
      return vault ? { ...vault } : null;
    } else {
      // Example: const vault = await contract.getVaultsById(id);
      throw new Error("Smart contract integration not implemented yet");
    }
  },
  
  /**
   * Create a new vault
   */
  createVault: async (vault: Omit<Vault, "id" | "createdAt" | "streams">): Promise<Vault> => {
    const config = getApiConfig();
    
    if (config.useMock) {
      await mockDelay();
      const newVault: Vault = {
        id: `vault-${localMockVaults.length + 1}`,
        createdAt: new Date().toISOString(),
        streams: [],
        ...vault
      };
      
      localMockVaults.push(newVault);
      return { ...newVault };
    } else {
      // Example: const newVault = await contract.createVault(vault);
      throw new Error("Smart contract integration not implemented yet");
    }
  },
  
  /**
   * Update a vault
   */
  updateVault: async (id: string, updates: Partial<Vault>): Promise<Vault> => {
    const config = getApiConfig();
    
    if (config.useMock) {
      await mockDelay();
      const index = localMockVaults.findIndex(p => p.id === id);
      
      if (index === -1) {
        throw new Error(`Vault with ID ${id} not found`);
      }
      
      const updatedVault = {
        ...localMockVaults[index],
        ...updates
      };
      
      localMockVaults[index] = updatedVault;
      return { ...updatedVault };
    } else {
      // Example: const updatedVault = await contract.updateVault(id, updates);
      throw new Error("Smart contract integration not implemented yet");
    }
  },
  
  /**
   * Delete a vault
   */
  deleteVault: async (id: string): Promise<boolean> => {
    const config = getApiConfig();
    
    if (config.useMock) {
      await mockDelay();
      const initialLength = localMockVaults.length;
      localMockVaults = localMockVaults.filter(p => p.id !== id);
      
      return localMockVaults.length !== initialLength;
    } else {
      // Example: const success = await contract.deleteVault(id);
      throw new Error("Smart contract integration not implemented yet");
    }
  },
  
  /**
   * Add credit to a vault
   */
  addCredit: async (id: string, amount: number): Promise<Vault> => {
    const config = getApiConfig();
    
    if (config.useMock) {
      await mockDelay();
      const index = localMockVaults.findIndex(p => p.id === id);
      
      if (index === -1) {
        throw new Error(`Vault with ID ${id} not found`);
      }
      
      const updatedVault = {
        ...localMockVaults[index],
        balance: localMockVaults[index].balance + amount
      };
      
      localMockVaults[index] = updatedVault;
      return { ...updatedVault };
    } else {
      // Example: const updatedVault = await contract.addCredit(id, amount);
      throw new Error("Smart contract integration not implemented yet");
    }
  },
  
  /**
   * Drain funds from a vault
   */
  drainVault: async (id: string, amount: number): Promise<Vault> => {
    const config = getApiConfig();
    
    if (config.useMock) {
      await mockDelay();
      const index = localMockVaults.findIndex(p => p.id === id);
      
      if (index === -1) {
        throw new Error(`Vault with ID ${id} not found`);
      }
      
      if (localMockVaults[index].balance < amount) {
        throw new Error(`Insufficient funds in vault. Available: ${localMockVaults[index].balance}`);
      }
      
      const updatedVault = {
        ...localMockVaults[index],
        balance: localMockVaults[index].balance - amount
      };
      
      localMockVaults[index] = updatedVault;
      return { ...updatedVault };
    } else {
      // Example: const updatedVault = await contract.drainVault(id, amount);
      throw new Error("Smart contract integration not implemented yet");
    }
  }
};
