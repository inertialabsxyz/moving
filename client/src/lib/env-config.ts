
import { SUPPORTED_TOKENS } from "./types";

// Environment configuration utility
// This file provides access to environment variables without modifying .gitignore

/**
 * Get environment variables with fallbacks
 * This allows us to use environment variables safely without modifying protected files
 */
export function getEnvConfig() {
  // Create token contracts map from SUPPORTED_TOKENS
  const tokenContracts: {[symbol: string]: string} = {};
  SUPPORTED_TOKENS.forEach(token => {
    tokenContracts[token.symbol] = token.fungibleAssetAddress;
  });

  return {
    // Check if mock mode is enabled
    // Now defaults to false if not specified
    useMock: import.meta.env.VITE_USE_MOCK === 'true',
    
    // Contract address for the stream contract
    contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS || undefined,
    
    // Network URL for the blockchain
    networkUrl: import.meta.env.VITE_NETWORK_URL || undefined,
    
    // Token contract addresses
    tokenContracts,
    
    // Log the current environment mode
    logMode: () => {
      console.log(`API Mode: ${import.meta.env.VITE_USE_MOCK === 'true' ? 'MOCK' : 'REAL'}`);
      if (import.meta.env.VITE_CONTRACT_ADDRESS) {
        console.log(`Contract: ${import.meta.env.VITE_CONTRACT_ADDRESS}`);
      }
      if (import.meta.env.VITE_NETWORK_URL) {
        console.log(`Network: ${import.meta.env.VITE_NETWORK_URL}`);
      }
      console.log('Token Contracts:', tokenContracts);
    }
  };
}

// Log the environment configuration on import
getEnvConfig().logMode();
