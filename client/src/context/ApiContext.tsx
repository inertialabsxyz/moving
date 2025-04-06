
import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { configureApi, getApiConfig, resetApiConfig, ApiConfig } from "@/lib/api-client";
import { getEnvConfig } from "@/lib/env-config";
import { SUPPORTED_TOKENS } from "@/lib/types";

interface ApiContextType {
  apiConfig: ApiConfig;
  setApiConfig: (config: Partial<ApiConfig>) => void;
  resetToEnvConfig: () => void;
  isLoading: boolean;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [apiConfig, setApiConfigState] = useState<ApiConfig>(getApiConfig());
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with environment configuration
  useEffect(() => {
    const envConfig = getEnvConfig();
    
    // Create token contracts map from SUPPORTED_TOKENS
    const tokenContracts: {[symbol: string]: string} = {};
    SUPPORTED_TOKENS.forEach(token => {
      tokenContracts[token.symbol] = token.fungibleAssetAddress;
    });
    
    configureApi({
      useMock: envConfig.useMock,
      contractAddress: envConfig.contractAddress,
      tokenContracts
    });
    
    setApiConfigState(getApiConfig());
  }, []);

  const setApiConfig = (config: Partial<ApiConfig>) => {
    setIsLoading(true);
    
    // Apply configuration
    configureApi(config);
    
    // Update state
    setApiConfigState(getApiConfig());
    
    // Simulate configuration time
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const resetToEnvConfig = () => {
    setIsLoading(true);
    
    // Reset to environment variables
    resetApiConfig();
    
    // Update state
    setApiConfigState(getApiConfig());
    
    // Simulate configuration time
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  return (
    <ApiContext.Provider value={{ apiConfig, setApiConfig, resetToEnvConfig, isLoading }}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  
  if (context === undefined) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  
  return context;
}
