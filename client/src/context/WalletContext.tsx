
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  useWallet,
  AptosWalletAdapterProvider,
} from '@aptos-labs/wallet-adapter-react';
import { Network } from "@aptos-labs/ts-sdk";
import { useToast } from '@/hooks/use-toast';
import { useApi } from './ApiContext';
import { Wallet, mockWallet } from '@/lib/types';
import { useWalletService } from "@/lib/services";

// Define the wallet context type
interface WalletContextType {
  connecting: boolean;
  connected: boolean;
  currentWallet: Wallet;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

// Create the context
const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletContextProvider({ children }: { children: ReactNode }) {
  // Use the ApiContext to check if we're using mock data
  const { apiConfig } = useApi();
  const { toast } = useToast();
  
  // Get wallet hooks from Aptos adapter
  const { 
    connect, 
    disconnect, 
    account, 
    connected: adapterConnected,
    wallet,
  } = useWallet();

  // Track connected state in our own state to ensure UI updates
  const [connected, setConnected] = useState(false);
  
  // Add a connecting state since it's not provided by the wallet adapter
  const [connecting, setConnecting] = useState(false);
  
  // State for the current wallet information
  const [currentWallet, setCurrentWallet] = useState<Wallet>(mockWallet);

  const {getCurrentWallet} = useWalletService();

  // Update our connected state when the adapter's connected state changes
  useEffect(() => {
    if (adapterConnected && account) {
      setConnected(true);
    } else {
      // If not connected via adapter and not using mock, set to false
      if (!apiConfig.useMock) {
        setConnected(false);
      }
    }
  }, [adapterConnected, account, apiConfig.useMock]);

  // Log wallet state whenever it changes for debugging
  useEffect(() => {
    console.log("WalletContext: connected =", connected);
    console.log("WalletContext: account =", account);
    console.log("WalletContext: wallet =", wallet);
  }, [connected, account, wallet]);

  // Update wallet information when connected
  useEffect(() => {
    if (connected && account) {
      console.log("Connected to wallet:", account.toString());

      getCurrentWallet().then(wallet => {
        // Update current wallet with connected account information
        setCurrentWallet(wallet);
        // Log current wallet state
        console.log("Connected to wallet:", account.address);
      });
    } else if (!connected && !apiConfig.useMock) {
      console.log("Not connected to wallet");
      // If disconnected and not using mock, show empty wallet
      setCurrentWallet({
        address: "",
        isCurrentUser: false,
        balances: {}
      });

      console.log("Disconnected wallet (real mode)");
    } else if (!connected && apiConfig.useMock) {
      // If disconnected but using mock, show mock wallet
      setCurrentWallet(mockWallet);
      console.log("Using mock wallet in mock mode");
    }
  }, [connected, account, apiConfig.useMock]);

  // Connect to wallet function - simplified to only use Nightly
  const connectWallet = async () => {
    if (apiConfig.useMock) {
      toast({
        title: "Using Mock Wallet",
        description: "You are in mock mode. Switch to real mode to connect a wallet.",
      });
      return;
    }
    
    try {
      setConnecting(true);
      
      // Connect to Nightly wallet using the proper WalletName type
      console.log("Connecting to Nightly wallet");
      // Use the wallet name from the NightlyWallet instance
      connect("Nightly");
      
      console.log("Successfully connected to Nightly wallet");
      // Explicitly set connected state here for immediate UI update
      setConnected(true);
      
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Nightly wallet"
      });
    } catch (error) {
      console.error("Wallet connection error:", error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet"
      });
      setConnected(false);
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    try {
      disconnect();
      setConnected(false);
      
      // If using mock, revert to mock wallet
      if (apiConfig.useMock) {
        setCurrentWallet(mockWallet);
      }
      
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected"
      });
    } catch (error) {
      console.error("Wallet disconnection error:", error);
      toast({
        variant: "destructive",
        title: "Disconnection Failed",
        description: error instanceof Error ? error.message : "Failed to disconnect wallet"
      });
    }
  };

  return (
    <WalletContext.Provider value={{
      connecting,
      connected,
      currentWallet,
      connectWallet,
      disconnectWallet,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

// Create a wrapper provider that includes both the Aptos wallet provider and our custom provider
export function AptosWalletProvider({ children }: { children: ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={false} // Keep as false to avoid auto-connecting on page load
      dappConfig={{
        network: Network.TESTNET,
      }}
      onError={(error: Error) => {
        console.error("Wallet adapter error:", error);
      }}
    >
      <WalletContextProvider>
        {children}
      </WalletContextProvider>
    </AptosWalletAdapterProvider>
  );
}

// Custom hook to use the wallet context
export function useWalletContext() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWalletContext must be used within a WalletContextProvider");
  }
  return context;
}
