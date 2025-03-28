
export interface Vault {
  id: string;
  owner: string;
  name?: string;
  balance: number;
  token: string;
  createdAt: string;
  streams: Stream[];
}

export interface Stream {
  id: string;
  vaultId: string;
  source: string;
  destination: string;
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

// Define supported tokens in one central location
export type TokenSymbol = 'APT' | 'STRM';

export interface TokenInfo {
  symbol: TokenSymbol;
  name: string;
  color: string;
  fungibleAsset: string;
}

export const SUPPORTED_TOKENS: TokenInfo[] = [
  {
    symbol: 'APT',
    name: 'Aptos',
    color: 'bg-blue-500/90',
    fungibleAsset: '0x1::aptos_coin::AptosCoin'
  },
  {
    symbol: 'STRM',
    name: 'Stream',
    color: 'bg-purple-500/90',
    fungibleAsset: '0x1::stream_coin::StreamCoin'
  }
];

// Helper function to get token info
export const getTokenInfo = (symbol: string): TokenInfo | undefined => {
  return SUPPORTED_TOKENS.find(token => token.symbol === symbol);
};

// Helper function to get token color class
export const getTokenColorClass = (symbol: string): string => {
  const token = getTokenInfo(symbol);
  return token?.color || 'bg-gray-500';
};

// Mock data for initial app state
export const mockWallet: Wallet = {
  address: "0x7F1AcF3C7e1BcF2Ee11337B4ebF4E2818aeC3F1D",
  isCurrentUser: true,
  balances: {
    "APT": 8750.42,
    "STRM": 12340.89
  }
};

export const mockVaults: Vault[] = [
  {
    id: "vault-1",
    name: "Payroll Vault",
    owner: "0x7F1AcF3C7e1BcF2Ee11337B4ebF4E2818aeC3F1D",
    balance: 5000,
    token: "APT",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    streams: [
      {
        id: "stream-1",
        vaultId: "vault-1",
        source: "0x7F1AcF3C7e1BcF2Ee11337B4ebF4E2818aeC3F1D",
        destination: "0xA742a3D13571B2ec9A1b2Fc038f7ACD9E7ed0E39",
        amountPerSecond: 0.01,
        totalStreamed: 845.23,
        totalWithdrawn: 700,
        token: "APT",
        active: true,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "stream-2",
        vaultId: "vault-1",
        source: "0x7F1AcF3C7e1BcF2Ee11337B4ebF4E2818aeC3F1D",
        destination: "0xB456b7C8fE9c543A0F9a61Dd13DA4208F8b1EfA2",
        amountPerSecond: 0.005,
        totalStreamed: 349.87,
        totalWithdrawn: 300,
        token: "APT",
        active: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "vault-2",
    name: "Marketing Expenses",
    owner: "0x7F1AcF3C7e1BcF2Ee11337B4ebF4E2818aeC3F1D",
    balance: 2000,
    token: "STRM",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    streams: [
      {
        id: "stream-3",
        vaultId: "vault-2",
        source: "0x7F1AcF3C7e1BcF2Ee11337B4ebF4E2818aeC3F1D",
        destination: "0xC123c452Fe98B876A516FB89D68e3c3BF1B6D8E9",
        amountPerSecond: 0.008,
        totalStreamed: 243.56,
        totalWithdrawn: 200,
        token: "STRM",
        active: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
];

export const mockStreams: Stream[] = [
  ...mockVaults[0].streams,
  ...mockVaults[1].streams,
  {
    id: "stream-4",
    vaultId: "vault-3",
    source: "0xD789dF5E91BB3Fa403f7A3B5Eb42E31D74F2B3A8",
    destination: "0x7F1AcF3C7e1BcF2Ee11337B4ebF4E2818aeC3F1D",
    amountPerSecond: 0.012,
    totalStreamed: 532.12,
    totalWithdrawn: 450,
    token: "STRM",
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
