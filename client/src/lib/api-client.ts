
import { Pool, Stream, mockPools, mockStreams, mockWallet, Wallet } from "./types";

// Configuration for API - allows switching between mock and real backend
export type ApiConfig = {
  useMock: boolean;
  contractAddress?: string;
  networkUrl?: string;
};

// Default to using mock data
let apiConfig: ApiConfig = {
  useMock: true
};

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
