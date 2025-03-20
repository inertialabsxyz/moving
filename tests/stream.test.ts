import {
    Aptos,
    AptosConfig,
    Network,
    Account,
    Ed25519Account,
} from "@aptos-labs/ts-sdk";
import {deploy} from "./deploy";
const config = new AptosConfig({ network: Network.LOCAL });
const aptos = new Aptos(config);
const alice = Account.generate();
const bob = Account.generate();
const MINT_AMOUNT = 100_000_000;

let deployerAccount = Account.generate();

enum Tokens {
    APT = "0xa",
}

async function migrateAccountToFA(signer: Ed25519Account) {
    // Move coins to FA
    // aptos move run --function-id 0x1::coin::migrate_to_fungible_store --type-args 0x1::aptos_coin::AptosCoin
    const transaction = await aptos.transaction.build.simple({
        sender: signer.accountAddress,
        data: {
            function: `0x1::coin::migrate_to_fungible_store`,
            functionArguments: [],
            typeArguments: ["0x1::aptos_coin::AptosCoin"],
        },
    });
    const pendingTransaction = await aptos.signAndSubmitTransaction({signer, transaction});
    const executedTransaction = await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});

    console.log(`Migration for account ${signer.accountAddress.toString()} with tx hash ${executedTransaction.hash}`);
}

async function mintSTRM(signer: Ed25519Account, account: Ed25519Account) {
    // aptos move run --function-id moving::stream_coin::mint --args address:0x1 u64:100000000
    const transaction = await aptos.transaction.build.simple({
        sender: signer.accountAddress,
        data: {
            function: `${deployerAccount.accountAddress}::stream_coin::mint`,
            functionArguments: [account.accountAddress, MINT_AMOUNT],
        },
    });
    const pendingTransaction = await aptos.signAndSubmitTransaction({signer, transaction});
    const executedTransaction = await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});

    console.log(`Funded account ${account.accountAddress.toString()} with ${MINT_AMOUNT} STRM with tx hash ${executedTransaction.hash}`);
}

beforeAll(async () => {
    deployerAccount = await deploy();
    await aptos.fundAccount({accountAddress: alice.accountAddress, amount: MINT_AMOUNT});
    await aptos.fundAccount({accountAddress: bob.accountAddress, amount: MINT_AMOUNT});
    await migrateAccountToFA(alice);
    await migrateAccountToFA(bob);
    await mintSTRM(deployerAccount, alice);
    await mintSTRM(deployerAccount, bob);
}, 60000);

interface WalletStore {
    inner: string
}

async function getPoolObject(account: Ed25519Account, token: string) {
    // Verify pool and assets in store
    const result = await aptos.view({
        payload: {
            function: `${deployerAccount.accountAddress}::streams::pool_address`,
            functionArguments: [`${account.accountAddress}`, token],
            typeArguments: ["0x1::fungible_asset::Metadata"],
        }
    });

    expect(result.length).toBe(1);
    const poolAddress = result[0]?.toString() || "";
    let type = `${deployerAccount.accountAddress}::streams::Pool<0x1::object::Object<0x1::fungible_asset::Metadata>>`;

    // @ts-ignore
    return await aptos.getAccountResource({accountAddress: poolAddress, resourceType: type});
}

// https://github.com/aptos-labs/aptos-ts-sdk/tree/main/examples/typescript
test("Create a pool", async () => {
    // aptos move run --function-id 17d1169c2f4e744ea21495510702cae3eba2230e928713bc07ae7c611cd1269b::streams::create_pool --type-args 0x1::fungible_asset::Metadata --args address:0xa u64:1000000
    let oldBalance = await aptos.account.getAccountAPTAmount(alice);
    let poolAmount = 100;
    const transaction = await aptos.transaction.build.simple({
        sender: alice.accountAddress,
        data: {
            function: `${deployerAccount.accountAddress}::streams::create_pool`,
            functionArguments: [Tokens.APT, poolAmount],
            typeArguments: ["0x1::fungible_asset::Metadata"],
        },
    });
    const pendingTransaction = await aptos.signAndSubmitTransaction({signer: alice, transaction});
    const executedTransaction = await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});
    const gasCost = parseInt(executedTransaction.gas_used) * (await aptos.getGasPriceEstimation()).gas_estimate;
    console.log(`Pool created:${executedTransaction.hash}`);
    // Verify assets have left wallet
    let newBalance = await aptos.account.getAccountAPTAmount(alice);
    expect(newBalance).toBe(oldBalance - poolAmount - gasCost);
    const poolObject = await getPoolObject(alice, Tokens.APT);
    const availableStoreAddress = poolObject["available"]["store"]["inner"];
    const availableStore = await aptos.getAccountResource({accountAddress: availableStoreAddress, resourceType: "0x1::fungible_asset::FungibleStore"});
    expect(availableStore["balance"]).toBe("100");

    // Alice's wallet store
    const walletView = await aptos.view({
        payload: {
            function: "0x1::primary_fungible_store::primary_store",
            functionArguments: [`${alice.accountAddress}`, Tokens.APT],
            typeArguments: ["0x1::fungible_asset::Metadata"],
        }
    });
    try {
        const inner = (walletView[0] as WalletStore).inner || "";
        // Verify that funds can't be manipulated
        const transferFA = await aptos.transaction.build.simple({
            sender: alice.accountAddress,
            data: {
                function: "0x1::fungible_asset::transfer",
                functionArguments: [availableStoreAddress, inner, 10],
                typeArguments: ["0x1::fungible_asset::FungibleStore"],
            },
        });

        const pendingTransaction = await aptos.signAndSubmitTransaction({signer: alice, transaction: transferFA});
        await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});

        throw new Error("Expected failure of transaction");
    } catch (error: any) {
        expect(error["transaction"]["vm_status"]).toContain("ENOT_STORE_OWNER(0x50008)");
    }
});

test("Drain from the pool", async () => {
    // Create the pool
    let poolAmount = 100;
    {
        const transaction = await aptos.transaction.build.simple({
            sender: alice.accountAddress,
            data: {
                function: `${deployerAccount.accountAddress}::streams::create_pool`,
                functionArguments: [Tokens.APT, poolAmount],
                typeArguments: ["0x1::fungible_asset::Metadata"],
            },
        });
        const pendingTransaction = await aptos.signAndSubmitTransaction({signer: alice, transaction});
        await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});
    }

    let drainAmount = 50;
    let oldBalance = await aptos.account.getAccountAPTAmount(alice);
    // Drain the pool
    const transaction = await aptos.transaction.build.simple({
        sender: alice.accountAddress,
        data:{
            function: `${deployerAccount.accountAddress}::streams::drain_pool`,
            functionArguments: [Tokens.APT, drainAmount],
            typeArguments: ["0x1::fungible_asset::Metadata"],
        }
    });
    const pendingTransaction = await aptos.signAndSubmitTransaction({signer: alice, transaction});
    const executedTransaction = await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});
    const gasCost = parseInt(executedTransaction.gas_used) * (await aptos.getGasPriceEstimation()).gas_estimate;

    // Verify assets have come into the wallet of Alice
    let newBalance = await aptos.account.getAccountAPTAmount(alice);
    expect(newBalance).toBe(oldBalance + drainAmount - gasCost);

    // Verify assets have left the pool
    const poolObject = await getPoolObject(alice, Tokens.APT);
    const availableStoreAddress = poolObject["available"]["store"]["inner"];
    const availableStore = await aptos.getAccountResource({accountAddress: availableStoreAddress, resourceType: "0x1::fungible_asset::FungibleStore"});
    expect(availableStore["balance"]).toBe((poolAmount - drainAmount).toString());
});