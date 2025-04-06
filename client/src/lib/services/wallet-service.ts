import {mockWallet, SUPPORTED_TOKENS, Wallet} from "../types";
import {getApiConfig, mockDelay} from "../api-client";
import {Aptos} from "@aptos-labs/ts-sdk";

// Keep track of the mock wallet state across service calls
const currentMockWallet = { ...mockWallet };

async function getFungibleAssetBalance(aptos: Aptos, account: string, token: string) : Promise<number> {
  try {
    const result = await aptos.view({
      payload: {
        function: "0x1::primary_fungible_store::balance",
        functionArguments: [`${account}`, token],
        typeArguments: ["0x1::fungible_asset::Metadata"],
      }
    });

    const [balance] = result.map(Number) as [number];
    return balance;
  } catch (error) {
    console.log(error);
  }

  return 0;
}

export const walletService = {
  /**
   * Get current wallet information
   */
  getCurrentWallet: async (aptos: Aptos, account?: string): Promise<Wallet> => {
    const apiConfig = getApiConfig();

    if (apiConfig.useMock) {
      await mockDelay();
      return { ...currentMockWallet };
    } else {
      if (!account) {
        console.log("Wallet not connected or no account available");
        return {
          address: "",
          isCurrentUser: false,
          balances: {}
        }
      }

      const wallet = {
        address: account,
        isCurrentUser: true,
        balances: {},
      }

      for (const token of SUPPORTED_TOKENS) {
        wallet.balances[token.symbol] = await getFungibleAssetBalance(aptos, account, token.fungibleAssetAddress);
      }

      console.log("Returning wallet data:", wallet);

      return wallet;
    }
  },
};
