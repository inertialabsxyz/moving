
import { Vault, Stream, mockVaults, mockStreams, mockWallet, Wallet, SUPPORTED_TOKENS } from "./types";

// Configuration for API - allows switching between mock and real backend
export type ApiConfig = {
  useMock: boolean;
  contractAddress?: string;
  networkUrl?: string;
  tokenContracts: {
    [symbol: string]: string;
  };
};

// Load initial config from environment variables with fallbacks
const getInitialConfig = (): ApiConfig => {
  // Create token contracts map from SUPPORTED_TOKENS
  const tokenContracts: {[symbol: string]: string} = {};
  SUPPORTED_TOKENS.forEach(token => {
    tokenContracts[token.symbol] = token.fungibleAsset;
  });

  return {
    useMock: import.meta.env.VITE_USE_MOCK !== 'false',
    contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS || undefined,
    networkUrl: import.meta.env.VITE_NETWORK_URL || undefined,
    tokenContracts
  };
};

// Initialize with values from env vars
let apiConfig: ApiConfig = getInitialConfig();

/**
 * Configure the API client
 */
export function configureApi(config: Partial<ApiConfig>) {
  apiConfig = { ...apiConfig, ...config };
  console.log("API configured:", apiConfig);
}

/**
 * Get current API configuration
 */
export function getApiConfig(): ApiConfig {
  return { ...apiConfig };
}

/**
 * Reset API configuration to values from environment variables
 */
export function resetApiConfig(): void {
  apiConfig = getInitialConfig();
  console.log("API configuration reset to env values:", apiConfig);
}

/**
 * Simulate network delay for mock data to mimic real API calls
 */
export async function mockDelay(minMs = 200, maxMs = 800): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Mock implementation of API error
 */
export class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}
