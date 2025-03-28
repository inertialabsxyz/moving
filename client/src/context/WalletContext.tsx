
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  useWallet,
  AptosWalletAdapterProvider
} from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { PontemWallet } from '@pontem/wallet-adapter-plugin';
import { MartianWallet } from '@martianwallet/aptos-wallet-adapter';
import { useToast } from '@/hooks/use-toast';
import { useApi } from './ApiContext';
import { Wallet, mockWallet } from '@/lib/types';

// Define the wallet context type
interface WalletContextType {
  connecting: boolean;
  connected: boolean;
  currentWallet: Wallet;
  connectWallet: () => void;
  disconnectWallet: () => void;
}

// Create the context
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Define supported wallets
const wallets = [
  new PetraWallet(),
  new PontemWallet(),
  new MartianWallet()
];

export function WalletContextProvider({ children }: { children: ReactNode }) {
  // Use the ApiContext to check if we're using mock data
  const { apiConfig } = useApi();
  const { toast } = useToast();
  
  // Get wallet hooks from Aptos adapter
  const { 
    connect, 
    disconnect, 
    account, 
    connected,
    wallet, 
    wallets: availableWallets 
  } = useWallet();

  // Add a connecting state since it's not provided by the wallet adapter
  const [connecting, setConnecting] = useState(false);
  
  // State for the current wallet information
  const [currentWallet, setCurrentWallet] = useState<Wallet>(mockWallet);

  // Update wallet information when connected
  useEffect(() => {
    if (connected && account) {
      setCurrentWallet({
        address: account.address,
        isCurrentUser: true,
        balances: currentWallet.balances // Keep existing balances for now
      });
      
      // Log current wallet state
      console.log("Connected to wallet:", account.address);
    } else if (!connected && !apiConfig.useMock) {
      // If disconnected and not using mock, show empty wallet
      setCurrentWallet({
        address: '',
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

  // Connect to wallet function
  const connectWallet = async () => {
    if (apiConfig.useMock) {
      toast({
        title: "Using Mock Wallet",
        description: "You are in mock mode. Switch to real mode to connect a wallet.",
      });
      return;
    }
    
    try {
      // If wallet is not defined, user will be prompted to select one
      if (!wallet) {
        toast({
          title: "Select Wallet",
          description: "Please select a wallet to connect"
        });
        return;
      }
      
      setConnecting(true);
      connect(wallet.name);
      
      toast({
        title: "Wallet Connected",
        description: `Successfully connected to ${wallet.name}`
      });
    } catch (error) {
      console.error("Wallet connection error:", error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet"
      });
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect wallet function
  const disconnectWallet = async () => {
    try {
      disconnect();
      
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
      disconnectWallet
    }}>
      {children}
    </WalletContext.Provider>
  );
}

// Create a wrapper provider that includes both the Aptos wallet provider and our custom provider
export function AptosWalletProvider({ children }: { children: ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={false}
      onError={(error: Error) => {
        console.error("Wallet error:", error);
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
