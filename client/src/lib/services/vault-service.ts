import { Vault, mockVaults } from "../types";
import { getApiConfig, mockDelay } from "../api-client";
import { useMemo } from "react";
import {
  useWallet,
} from '@aptos-labs/wallet-adapter-react';

// Local mutable mock data
const localMockVaults = [...mockVaults];

export const useVaultService = () => {
  const { account, signAndSubmitTransaction, network } = useWallet();
  const config = useMemo(() => getApiConfig(), []);

  const getVaults = async () => {
    if (config.useMock) {
      await mockDelay();
      return [...localMockVaults];
    } else {
      throw new Error("Smart contract integration not implemented yet");
    }
  };

  const getVaultsById = async(id : string) => {
    if (config.useMock) {
      await mockDelay();
      const vault = localMockVaults.find(p => p.id === id);
      return vault ? { ...vault } : null;
    } else {
      throw new Error("Smart contract integration not implemented yet");
    }
  };

  const createVault = async (vault: Omit<Vault, "id" | "createdAt" | "streams">) : Promise<Vault> => {
    if (config.useMock) {
      await mockDelay();
      const newVault: Vault = {
        id: `vault-${localMockVaults.length + 1}`,
        createdAt: new Date().toISOString(),
        streams: [],
        ...vault,
      };
      localMockVaults.push(newVault);
      return { ...newVault };
    } else {
      const response = await signAndSubmitTransaction({
        data: {
          function: `${import.meta.env.VITE_CONTRACT_ADDRESS}::streams::create_vault`,
          functionArguments: ["test", "0xa", 100000],
          typeArguments: ["0x1::fungible_asset::Metadata"],
        },
      });

      return {
        ...vault,
        id: "",
        createdAt: new Date().toISOString(),
        streams: [],
      };
    }
  };

  const updateVault = async (id: string, updates: Partial<Vault>) : Promise<Vault> => {
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
      throw new Error("Smart contract integration not implemented yet");
    }
  };

  const deleteVault = async (id: string) : Promise<boolean> => {
    if (config.useMock) {
      await mockDelay();
      const initialLength = localMockVaults.length;
      // localMockVaults = localMockVaults.filter(p => p.id !== id);

      return localMockVaults.length !== initialLength;
    } else {
      throw new Error("Smart contract integration not implemented yet");
    }
  };

  const addCredit = async (id: string, amount: number) : Promise<Vault> => {
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
      throw new Error("Smart contract integration not implemented yet");
    }
  };

  const drainVault = async (id: string, amount: number): Promise<Vault> => {
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
      throw new Error("Smart contract integration not implemented yet");
    }
  };

  return {
    getVaults,
    getVaultsById,
    createVault,
    updateVault,
    deleteVault,
    addCredit,
    drainVault,
  };
};
