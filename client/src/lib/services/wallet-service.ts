import {mockWallet, SUPPORTED_TOKENS, Wallet} from "../types";
import {getApiConfig, mockDelay} from "../api-client";
import {Aptos} from "@aptos-labs/ts-sdk";
import { useMemo } from "react";
import { useWallet} from "@aptos-labs/wallet-adapter-react";
import { AptosConfig } from "@aptos-labs/ts-sdk";
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

export const useWalletService = () => {
  const config = useMemo(() => getApiConfig(), []);
  const {account, network} = useWallet();

  const getCurrentWallet = async (): Promise<Wallet> => {
    if (config.useMock) {
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

      const aptosConfig = new AptosConfig({
        network: network?.name,
        fullnode: network?.url
      });

      const wallet = {
        address: account.address.toString(),
        isCurrentUser: true,
        balances: {},
      }

      const aptos = new Aptos(aptosConfig);

      for (const token of SUPPORTED_TOKENS) {
        wallet.balances[token.symbol] = await getFungibleAssetBalance(aptos, wallet.address, token.fungibleAssetAddress);
      }

      console.log("Returning wallet data:", wallet);

      return wallet;
    }
  };

  return {
    getCurrentWallet,
  }
};
