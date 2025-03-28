
export interface Pool {
  id: string;
  owner: string;
  name?: string; // Add name field to Pool
  balance: number;
  token: string;
  createdAt: string;
  streams: Stream[];
}

export interface Stream {
  id: string;
  poolId: string;
  source: string; // Owner wallet address
  destination: string; // Destination wallet address
  amountPerSecond: number;
  totalStreamed: number;
  totalWithdrawn: number;
  token: string;
  active: boolean;
  createdAt: string;
}

export interface Wallet {
  address: string;
  isCurrentUser: boolean;
  balances?: {
    [key: string]: number;
  };
}

// Mock data for initial app state
export const mockWallet: Wallet = {
  address: "0x7F1AcF3C7e1BcF2Ee11337B4ebF4E2818aeC3F1D",
  isCurrentUser: true,
  balances: {
    "USDC": 8750.42,
    "MOVE": 12340.89
  }
};

export const mockPools: Pool[] = [
  {
    id: "pool-1",
    name: "Payroll Vault", // Renamed from "Payroll Pool"
    owner: "0x7F1AcF3C7e1BcF2Ee11337B4ebF4E2818aeC3F1D",
    balance: 5000,
    token: "USDC",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    streams: [
      {
        id: "stream-1",
        poolId: "pool-1",
        source: "0x7F1AcF3C7e1BcF2Ee11337B4ebF4E2818aeC3F1D",
        destination: "0xA742a3D13571B2ec9A1b2Fc038f7ACD9E7ed0E39",
        amountPerSecond: 0.01,
        totalStreamed: 845.23,
        totalWithdrawn: 700,
        token: "USDC",
        active: true,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "stream-2",
        poolId: "pool-1",
        source: "0x7F1AcF3C7e1BcF2Ee11337B4ebF4E2818aeC3F1D",
        destination: "0xB456b7C8fE9c543A0F9a61Dd13DA4208F8b1EfA2",
        amountPerSecond: 0.005,
        totalStreamed: 349.87,
        totalWithdrawn: 300,
        token: "USDC",
        active: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "pool-2",
    name: "Marketing Expenses", // Keep existing name
    owner: "0x7F1AcF3C7e1BcF2Ee11337B4ebF4E2818aeC3F1D",
    balance: 2000,
    token: "MOVE",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    streams: [
      {
        id: "stream-3",
        poolId: "pool-2",
        source: "0x7F1AcF3C7e1BcF2Ee11337B4ebF4E2818aeC3F1D",
        destination: "0xC123c452Fe98B876A516FB89D68e3c3BF1B6D8E9",
        amountPerSecond: 0.008,
        totalStreamed: 243.56,
        totalWithdrawn: 200,
        token: "MOVE",
        active: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
];

export const mockStreams: Stream[] = [
  ...mockPools[0].streams,
  ...mockPools[1].streams,
  {
    id: "stream-4",
    poolId: "pool-3",
    source: "0xD789dF5E91BB3Fa403f7A3B5Eb42E31D74F2B3A8",
    destination: "0x7F1AcF3C7e1BcF2Ee11337B4ebF4E2818aeC3F1D",
    amountPerSecond: 0.012,
    totalStreamed: 532.12,
    totalWithdrawn: 450,
    token: "MOVE",
    active: true,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const formatAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};
