
import { configureApi, getApiConfig } from "../api-client";
import { walletService } from "./wallet-service";
import { poolService } from "./pool-service";
import { streamService } from "./stream-service";

// Export all services and API configuration functions
export {
  // Configuration
  configureApi,
  getApiConfig,
  
  // Services
  walletService,
  poolService,
  streamService
};
