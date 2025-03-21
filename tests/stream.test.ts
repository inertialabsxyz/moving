import {
    Aptos,
    AptosConfig,
    Network,
    Account,
    Ed25519Account, MoveValue,
} from "@aptos-labs/ts-sdk";
import {deploy} from "./deploy";
const config = new AptosConfig({ network: Network.LOCAL });
const aptos = new Aptos(config);

const accounts = {
    alice: Account.generate(),
    bob: Account.generate(),
    charlie: Account.generate(),
    dave: Account.generate()
};
const MINT_AMOUNT = 100_000_000;

interface Object {
    inner: string
}

let deployerAccount = Account.generate();

async function getSTRMAddress() : Promise<string> {
    const result = await aptos.view({
        payload: {
            function: `${deployerAccount.accountAddress}::stream_coin::get_metadata`,
            functionArguments: [],
        }
    });

    return (result[0] as Object).inner || "";
}

const Tokens = {
    APT: "0xa", STRM: "",


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
    await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});
}

async function mintSTRM(signer: Ed25519Account, account: Ed25519Account) {
    const transaction = await aptos.transaction.build.simple({
        sender: signer.accountAddress,
        data: {
            function: `${deployerAccount.accountAddress}::stream_coin::mint`,
            functionArguments: [account.accountAddress, MINT_AMOUNT],
        },
    });
    const pendingTransaction = await aptos.signAndSubmitTransaction({signer, transaction});
    await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});
}

async function setupAccounts(accounts: Array<Ed25519Account>) {
    for (const account of accounts) {
        await aptos.fundAccount({accountAddress: account.accountAddress, amount: MINT_AMOUNT});
        await migrateAccountToFA(account);
        await mintSTRM(deployerAccount, account);
    }
}
beforeAll(async () => {
    deployerAccount = await deploy();
    await setupAccounts(Object.values(accounts));
    Tokens.STRM = await getSTRMAddress();
}, 60000);

async function getPoolAddress(account: Ed25519Account, token: string) : Promise<MoveValue> {
    const result = await aptos.view({
        payload: {
            function: `${deployerAccount.accountAddress}::streams::pool_address`,
            functionArguments: [`${account.accountAddress}`, token],
            typeArguments: ["0x1::fungible_asset::Metadata"],
        }
    });

    expect(result.length).toBe(1);

    return result[0]?.toString() || "";
}

async function getPoolObject(account: Ed25519Account, token: string) {
    const poolAddress = await getPoolAddress(account, token);
    let type = `${deployerAccount.accountAddress}::streams::Pool<0x1::object::Object<0x1::fungible_asset::Metadata>>`;

    // @ts-ignore
    return await aptos.getAccountResource({accountAddress: poolAddress, resourceType: type});
}

async function createPool(account: Ed25519Account, poolAmount: number, token: string = Tokens.APT) {
    const transaction = await aptos.transaction.build.simple({
        sender: account.accountAddress,
        data: {
            function: `${deployerAccount.accountAddress}::streams::create_pool`,
            functionArguments: [token, poolAmount],
            typeArguments: ["0x1::fungible_asset::Metadata"],
        },
    });
    const pendingTransaction = await aptos.signAndSubmitTransaction({signer: account, transaction});
    await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});
}

// https://github.com/aptos-labs/aptos-ts-sdk/tree/main/examples/typescript
test("Create a pool", async () => {
    // aptos move run --function-id 17d1169c2f4e744ea21495510702cae3eba2230e928713bc07ae7c611cd1269b::streams::create_pool --type-args 0x1::fungible_asset::Metadata --args address:0xa u64:1000000
    let oldBalance = await aptos.account.getAccountAPTAmount(accounts.alice);
    let poolAmount = 100;
    const transaction = await aptos.transaction.build.simple({
        sender: accounts.alice.accountAddress,
        data: {
            function: `${deployerAccount.accountAddress}::streams::create_pool`,
            functionArguments: [Tokens.APT, poolAmount],
            typeArguments: ["0x1::fungible_asset::Metadata"],
        },
    });
    const pendingTransaction = await aptos.signAndSubmitTransaction({signer: accounts.alice, transaction});
    const executedTransaction = await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});
    const gasCost = parseInt(executedTransaction.gas_used) * (await aptos.getGasPriceEstimation()).gas_estimate;
    // Verify assets have left wallet
    let newBalance = await aptos.account.getAccountAPTAmount(accounts.alice);
    expect(newBalance).toBe(oldBalance - poolAmount - gasCost);
    const poolObject = await getPoolObject(accounts.alice, Tokens.APT);
    const availableStoreAddress = poolObject["available"]["store"]["inner"];
    const availableStore = await aptos.getAccountResource({accountAddress: availableStoreAddress, resourceType: "0x1::fungible_asset::FungibleStore"});
    expect(availableStore["balance"]).toBe("100");

    // Alice's wallet store
    const walletView = await aptos.view({
        payload: {
            function: "0x1::primary_fungible_store::primary_store",
            functionArguments: [`${accounts.alice.accountAddress}`, Tokens.APT],
            typeArguments: ["0x1::fungible_asset::Metadata"],
        }
    });
    try {
        const inner = (walletView[0] as Object).inner || "";
        // Verify that funds can't be manipulated
        const transferFA = await aptos.transaction.build.simple({
            sender: accounts.alice.accountAddress,
            data: {
                function: "0x1::fungible_asset::transfer",
                functionArguments: [availableStoreAddress, inner, 10],
                typeArguments: ["0x1::fungible_asset::FungibleStore"],
            },
        });

        const pendingTransaction = await aptos.signAndSubmitTransaction({signer: accounts.alice, transaction: transferFA});
        await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});

        throw new Error("Expected failure of transaction");
    } catch (error: any) {
        expect(error["transaction"]["vm_status"]).toContain("ENOT_STORE_OWNER(0x50008)");
    }
});

test("Drain from the pool", async () => {
    // Create the pool
    let poolAmount = 100;
    await createPool(accounts.alice, poolAmount);

    let drainAmount = 50;
    let oldBalance = await aptos.account.getAccountAPTAmount(accounts.alice);
    // Drain the pool
    const transaction = await aptos.transaction.build.simple({
        sender: accounts.alice.accountAddress,
        data:{
            function: `${deployerAccount.accountAddress}::streams::drain_pool`,
            functionArguments: [Tokens.APT, drainAmount],
            typeArguments: ["0x1::fungible_asset::Metadata"],
        }
    });
    const pendingTransaction = await aptos.signAndSubmitTransaction({signer: accounts.alice, transaction});
    const executedTransaction = await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});
    const gasCost = parseInt(executedTransaction.gas_used) * (await aptos.getGasPriceEstimation()).gas_estimate;

    // Verify assets have come into the wallet of Alice
    let newBalance = await aptos.account.getAccountAPTAmount(accounts.alice);
    expect(newBalance).toBe(oldBalance + drainAmount - gasCost);

    // Verify assets have left the pool
    const poolObject = await getPoolObject(accounts.alice, Tokens.APT);
    const availableStoreAddress = poolObject["available"]["store"]["inner"];
    const availableStore = await aptos.getAccountResource({accountAddress: availableStoreAddress, resourceType: "0x1::fungible_asset::FungibleStore"});
    expect(availableStore["balance"]).toBe((poolAmount - drainAmount).toString());
});

test("Excess Drain from the pool", async () => {
    // Create the pool
    let poolAmount = 100;
    await createPool(accounts.alice, poolAmount);

    try {
        let drainAmount = poolAmount + 1;
        // Drain the pool
        const transaction = await aptos.transaction.build.simple({
            sender: accounts.alice.accountAddress,
            data: {
                function: `${deployerAccount.accountAddress}::streams::drain_pool`,
                functionArguments: [Tokens.APT, drainAmount],
                typeArguments: ["0x1::fungible_asset::Metadata"],
            }
        });
        const pendingTransaction = await aptos.signAndSubmitTransaction({signer: accounts.alice, transaction});
        await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});
        throw new Error("Expected failure of transaction");
    } catch (error: any) {
        console.log(error["transaction"]["vm_status"]);
        expect(error["transaction"]["vm_status"]).toContain("EINSUFFICIENT_BALANCE(0x10004)");
    }
});

test("Credit the pool", async () => {
    // Create the pool
    let poolAmount = 100;
    await createPool(accounts.alice, poolAmount);

    const poolAddr = await getPoolAddress(accounts.alice, Tokens.APT);
    let poolAddress = poolAddr?.toString() || "";

    let creditAmount = 50;

    for (const account of Object.values(accounts)) {
        let oldBalance = await aptos.account.getAccountAPTAmount(account);
        // Credit the pool
        const transaction = await aptos.transaction.build.simple({
            sender: account.accountAddress,
            data:{
                function: `${deployerAccount.accountAddress}::streams::credit_pool`,
                functionArguments: [poolAddress, Tokens.APT, creditAmount],
                typeArguments: ["0x1::fungible_asset::Metadata"],
            }
        });
        const pendingTransaction = await aptos.signAndSubmitTransaction({signer: account, transaction});
        const executedTransaction = await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});
        const gasCost = parseInt(executedTransaction.gas_used) * (await aptos.getGasPriceEstimation()).gas_estimate;

        let newBalance = await aptos.account.getAccountAPTAmount(account);
        expect(newBalance).toBe(oldBalance - creditAmount - gasCost);

        const poolObject = await getPoolObject(accounts.alice, Tokens.APT);
        const availableStoreAddress = poolObject["available"]["store"]["inner"];
        const availableStore = await aptos.getAccountResource({accountAddress: availableStoreAddress, resourceType: "0x1::fungible_asset::FungibleStore"});
        poolAmount += creditAmount;
        expect(availableStore["balance"]).toBe(poolAmount.toString());
    }
});

interface PoolView {
    available: number,
    committed: number,
}

async function viewPool(account: Ed25519Account, token: string) : Promise<PoolView> {
    const poolAddr = await getPoolAddress(accounts.alice, Tokens.APT);
    let poolAddress = poolAddr?.toString() || "";

    const result = await aptos.view({
        payload: {
            function: `${deployerAccount.accountAddress}::streams::view_pool`,
            functionArguments: [poolAddress],
            typeArguments: ["0x1::fungible_asset::Metadata"],
        }
    });

    const [available, committed] = result.map(Number) as [number, number];
    return { available, committed };
}

test("View a pool", async () => {
    // Create the pool
    let poolAmount = 100;
    await createPool(accounts.alice, poolAmount);
    let poolView = await viewPool(accounts.alice, Tokens.APT);

    expect(poolView.available).toBe(poolAmount);
    expect(poolView.committed).toBe(0);
});

test("Create multiple pools", async () => {
    // Create the pool
    let poolAmount = 100;

    let tokens = [Tokens.APT, Tokens.STRM];

    for (const token of tokens) {
        for (const account of Object.values(accounts)) {
            await createPool(account, poolAmount, token);
            let poolView = await viewPool(account, token);

            expect(poolView.available).toBe(poolAmount);
            expect(poolView.committed).toBe(0);
        }
    }
});
