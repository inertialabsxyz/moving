import {
    Account,
    AccountAddress,
    Aptos,
    AptosConfig,
    Ed25519Account,
    FixedBytes,
    Network,
    sleep,
    UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import {deploy} from "./deploy";

const MINT_AMOUNT = 100_000_000;
const config = new AptosConfig({ network: Network.LOCAL });
const aptos = new Aptos(config);
let deployerAccount = Account.generate();

interface Object {
    inner: string
}

async function getSTRMAddress() : Promise<`0x${string}`> {
    const result = await aptos.view({
        payload: {
            function: `${deployerAccount.accountAddress}::stream_coin::get_metadata`,
            functionArguments: [],
        }
    });

    const addr =  (result[0] as Object).inner || "";
    if (!addr.startsWith("0x")) throw new Error("Invalid STRM address");
    return addr as `0x${string}`;
}

const Tokens : { APT: `0x${string}`; STRM: `0x${string}` } = {
    APT: "0xa", STRM: "0x0",
}

async function migrateAccountToFA(signer: Ed25519Account) {
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

async function getFungibleAssetBalance(account: Ed25519Account, token: string = Tokens.APT) : Promise<number> {
    let result = await aptos.view({
        payload: {
            function: "0x1::primary_fungible_store::balance",
            functionArguments: [`${account.accountAddress}`, token],
            typeArguments: ["0x1::fungible_asset::Metadata"],
        }
    });
    const [balance] = result.map(Number) as [number];
    return balance;
}

async function createAccount() : Promise<Ed25519Account> {
    const account = Account.generate();
    await aptos.fundAccount({accountAddress: account.accountAddress, amount: MINT_AMOUNT});
    await migrateAccountToFA(account);
    await mintSTRM(deployerAccount, account);
    return account;
}

async function getPoolAddress(account: Ed25519Account, token: string) : Promise<`0x${string}`> {
    const result = await aptos.view({
        payload: {
            function: `${deployerAccount.accountAddress}::streams::pool_address`,
            functionArguments: [`${account.accountAddress}`, token],
            typeArguments: ["0x1::fungible_asset::Metadata"],
        }
    });

    expect(result.length).toBe(1);

    const addr =  result[0]?.toString() || "";
    if (!addr.startsWith("0x")) throw new Error("Invalid Pool address");
    return addr as `0x${string}`;
}

async function getPoolObject(account: Ed25519Account, token: string) {
    const poolAddress = await getPoolAddress(account, token);
    let type = `${deployerAccount.accountAddress}::streams::Pool<0x1::object::Object<0x1::fungible_asset::Metadata>>`;

    // @ts-ignore
    return await aptos.getAccountResource({accountAddress: poolAddress, resourceType: type});
}

async function createPool({account, poolAmount, name = "Pool", token = Tokens.APT}: {
    account: Ed25519Account,
    poolAmount: number,
    name?: string,
    token?: string
}) {

    let oldBalance = await getFungibleAssetBalance(account, token);
    const transaction = await aptos.transaction.build.simple({
        sender: account.accountAddress,
        data: {
            function: `${deployerAccount.accountAddress}::streams::create_pool`,
            functionArguments: [name, token, poolAmount],
            typeArguments: ["0x1::fungible_asset::Metadata"],
        },
    });
    const pendingTransaction = await aptos.signAndSubmitTransaction({signer: account, transaction});
    const executedTransaction = await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});
    let gasCost = 0;
    if (token === Tokens.APT) {
        gasCost = parseInt(executedTransaction.gas_used) * (await aptos.getGasPriceEstimation()).gas_estimate;
    }
    // Verify assets have left wallet
    let newBalance = await getFungibleAssetBalance(account, token);
    expect(newBalance).toBe(oldBalance - poolAmount - gasCost);

    return await getPoolObject(account, token);
}

async function viewPool(account: Ed25519Account, token: string) : Promise<PoolView> {
    const poolAddr = await getPoolAddress(account, token);
    let poolAddress = poolAddr?.toString() || "";

    const result = await aptos.view({
        payload: {
            function: `${deployerAccount.accountAddress}::streams::view_pool`,
            functionArguments: [poolAddress],
            typeArguments: ["0x1::fungible_asset::Metadata"],
        }
    });

    const [nameRaw, availableRaw, committedRaw, lastBalanceRaw] = result;
    const name = nameRaw as string;
    const available = Number(availableRaw);
    const committed = Number(committedRaw);
    const lastBalance = Number(lastBalanceRaw);
    return { name, available, committed, lastBalance };
}

async function settlePool(account: Ed25519Account, poolAddress: string) {
    const transaction = await aptos.transaction.build.simple({
        sender: account.accountAddress,
        data:{
            function: `${deployerAccount.accountAddress}::streams::settle_pool`,
            functionArguments: [poolAddress],
            typeArguments: ["0x1::fungible_asset::Metadata"],
        }
    });
    const pendingTransaction = await aptos.signAndSubmitTransaction({signer: account, transaction});
    await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});
}

async function startStream(account: Ed25519Account, token: string, destination: AccountAddress, perSecond: number) : Promise<string> {
    const transaction = await aptos.transaction.build.simple({
        sender: account.accountAddress,
        data:{
            function: `${deployerAccount.accountAddress}::streams::start_stream`,
            functionArguments: [token, destination, perSecond],
            typeArguments: ["0x1::fungible_asset::Metadata"],
        }
    });

    const pendingTransaction = await aptos.signAndSubmitTransaction({signer: account, transaction});
    const executedTransaction = await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});
    return (executedTransaction as UserTransactionResponse).events[0].data.stream_id;
}

interface PoolView {
    name: string,
    available: number,
    committed: number,
    lastBalance: number,
}

beforeAll(async () => {
    deployerAccount = await deploy();
    Tokens.STRM = await getSTRMAddress();
}, 60000);

test("Create a pool", async () => {
    let poolAmount = 100;
    let alice = await createAccount();
    const poolObject = await createPool({account: alice, poolAmount: poolAmount});
    const availableStoreAddress = poolObject["available"]["store"]["inner"];
    const availableStore = await aptos.getAccountResource({accountAddress: availableStoreAddress, resourceType: "0x1::fungible_asset::FungibleStore"});
    expect(parseInt(availableStore["balance"])).toBe(poolAmount);

    // Alice's wallet store
    const walletView = await aptos.view({
        payload: {
            function: "0x1::primary_fungible_store::primary_store",
            functionArguments: [`${alice.accountAddress}`, Tokens.APT],
            typeArguments: ["0x1::fungible_asset::Metadata"],
        }
    });

    try {
        const inner = (walletView[0] as Object).inner || "";
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

        expect(false).toBeTruthy();
    } catch (error: any) {
        expect(error["transaction"]["vm_status"]).toContain("ENOT_STORE_OWNER(0x50008)");
    }
});

test("Drain from the pool", async () => {
    // Create the pool
    let poolAmount = 100;
    let alice = await createAccount();
    let poolObject = await createPool({account: alice, poolAmount: poolAmount});

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
    const availableStoreAddress = poolObject["available"]["store"]["inner"];
    const availableStore = await aptos.getAccountResource({accountAddress: availableStoreAddress, resourceType: "0x1::fungible_asset::FungibleStore"});
    expect(availableStore["balance"]).toBe((poolAmount - drainAmount).toString());
});

test("Excess Drain from the pool", async () => {

    let alice = await createAccount();
    let poolAmount = 100;
    await createPool({account: alice, poolAmount: poolAmount});

    try {
        let drainAmount = poolAmount + 1;
        // Drain the pool
        const transaction = await aptos.transaction.build.simple({
            sender:alice.accountAddress,
            data: {
                function: `${deployerAccount.accountAddress}::streams::drain_pool`,
                functionArguments: [Tokens.APT, drainAmount],
                typeArguments: ["0x1::fungible_asset::Metadata"],
            }
        });
        const pendingTransaction = await aptos.signAndSubmitTransaction({signer: alice, transaction});
        await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});
        expect(false).toBeTruthy();
    } catch (error: any) {
        console.log(error["transaction"]["vm_status"]);
        expect(error["transaction"]["vm_status"]).toContain("EINSUFFICIENT_BALANCE(0x10004)");
    }
});

test("Credit the pool", async () => {

    let alice = await createAccount();
    let poolAmount = 100;
    let poolObject = await createPool({account: alice, poolAmount: poolAmount});

    const poolAddr = await getPoolAddress(alice, Tokens.APT);
    let poolAddress = poolAddr?.toString() || "";

    let creditAmount = 50;
    let accounts = [
        await createAccount(),
        await createAccount(),
        await createAccount()
    ];

    for (const account of accounts) {
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

        const availableStoreAddress = poolObject["available"]["store"]["inner"];
        const availableStore = await aptos.getAccountResource({accountAddress: availableStoreAddress, resourceType: "0x1::fungible_asset::FungibleStore"});
        poolAmount += creditAmount;
        expect(availableStore["balance"]).toBe(poolAmount.toString());
    }
}, 30000);

test("View a pool", async () => {

    let alice = await createAccount();
    let poolAmount = 100;
    let name = "Payroll";
    await createPool({account: alice, poolAmount: poolAmount, name});
    let poolView = await viewPool(alice, Tokens.APT);

    expect(poolView.name).toBe(name);
    expect(poolView.available).toBe(poolAmount);
    expect(poolView.committed).toBe(0);
});

test("Create multiple pools", async () => {
    // Create the pool
    let poolAmount = 100;

    let tokens = [Tokens.APT, Tokens.STRM];
    let accounts = [
        await createAccount(),
        await createAccount(),
        await createAccount()
    ];

    for (const token of tokens) {
        for (const account of accounts) {
            await createPool({account: account, poolAmount: poolAmount, token});
            let poolView = await viewPool(account, token);

            expect(poolView.available).toBe(poolAmount);
            expect(poolView.committed).toBe(0);
        }
    }
}, 30000);

test("Create stream", async () => {

    let alice = await createAccount();
    let bob = await createAccount();
    let poolAmount = 100;
    let perSecond = 10;

    await createPool({account: alice, poolAmount: poolAmount});

    await startStream(alice, Tokens.APT, bob.accountAddress, perSecond);

    const poolObject = await getPoolObject(alice, Tokens.APT);
    const originalLastBalance = parseInt(poolObject["last_balance"]);
    expect(poolObject["streams"]["data"].length).toBe(1);
    let stream = poolObject["streams"]["data"][0]["value"];
    expect(stream["destination"].substring(2).padStart(64, '0')).toBe(bob.accountAddress.toStringWithoutPrefix());
    expect(parseInt(stream["per_second"])).toBe(perSecond);
    let poolAddress = await getPoolAddress(alice, Tokens.APT);
    expect(stream["pool"]).toBe(poolAddress);

    let sleepFor = 5;
    await sleep(sleepFor * 1000);

    // Settle the pool
    await settlePool(alice, poolAddress);

    // Check we have now the amount committed
    let poolView = await viewPool(alice, Tokens.APT);

    const time = poolView.lastBalance - originalLastBalance;
    expect(poolView.committed).toBe(time * perSecond);
    expect(poolView.available).toBe(poolAmount - time * perSecond);

}, 10000);

async function makeWithdrawal(account: Ed25519Account, poolAddress: string, streamId: string) {
    const transaction = await aptos.transaction.build.simple({
        sender: account.accountAddress,
        data:{
            function: `${deployerAccount.accountAddress}::streams::make_withdrawal_from_stream`,
            functionArguments: [poolAddress, new FixedBytes(streamId).value],
            typeArguments: ["0x1::fungible_asset::Metadata"],
        }
    });

    const pendingTransaction = await aptos.signAndSubmitTransaction({signer: account, transaction});
    await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});
}

async function closeStream(account: Ed25519Account, poolAddress: string, streamId: string) {
    const transaction = await aptos.transaction.build.simple({
        sender: account.accountAddress,
        data:{
            function: `${deployerAccount.accountAddress}::streams::close_stream`,
            functionArguments: [poolAddress, new FixedBytes(streamId).value],
            typeArguments: ["0x1::fungible_asset::Metadata"],
        }
    });

    const pendingTransaction = await aptos.signAndSubmitTransaction({signer: account, transaction});
    await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});
}

test("Create stream and withdraw", async () => {

    let alice = await createAccount();
    let bob = await createAccount();
    let poolAmount = 100;
    let perSecond = 1;
    let oldBalance = await aptos.account.getAccountAPTAmount(bob);

    let poolObject = await createPool({account: alice, poolAmount: poolAmount});
    const originalLastBalance = parseInt(poolObject["last_balance"]);
    let streamId = await startStream(alice, Tokens.APT, bob.accountAddress, perSecond);
    let sleepFor = 5;
    // Sleep a while extra to make sure we don't round down
    await sleep(sleepFor * 1000);
    let poolAddress = await getPoolAddress(alice, Tokens.APT);
    await makeWithdrawal(alice, poolAddress, streamId);
    let poolView = await viewPool(alice, Tokens.APT);
    sleep(500);
    let newBalance = await aptos.account.getAccountAPTAmount(bob);
    expect(newBalance - oldBalance).toBe((poolView.lastBalance - originalLastBalance) * perSecond);

}, 10000);

test("Create stream and close", async () => {
    let alice = await createAccount();
    let bob = await createAccount();
    let poolAmount = 100;
    let perSecond = 1;
    let oldBalance = await aptos.account.getAccountAPTAmount(bob);

    let poolObject = await createPool({account: alice, poolAmount: poolAmount});
    const originalLastBalance = parseInt(poolObject["last_balance"]);
    let streamId = await startStream(alice, Tokens.APT, bob.accountAddress, perSecond);
    let sleepFor = 5;
    // Sleep a while extra to make sure we don't round down
    await sleep(sleepFor * 1000);
    let poolAddress = await getPoolAddress(alice, Tokens.APT);
    await closeStream(alice, poolAddress, streamId);
    let poolView = await viewPool(alice, Tokens.APT);
    let newBalance = await aptos.account.getAccountAPTAmount(bob);
    expect(newBalance - oldBalance).toBe((poolView.lastBalance - originalLastBalance) * perSecond);

}, 10000);

test("Create stream and cancel to have debt", async () => {
    let alice = await createAccount();
    let bob = await createAccount();
    let poolAmount = 4;
    let perSecond = 1;
    let oldBalance = await aptos.account.getAccountAPTAmount(bob);

    let poolObject = await createPool({account: alice, poolAmount: poolAmount});
    const originalLastBalance = parseInt(poolObject["last_balance"]);
    let streamId = await startStream(alice, Tokens.APT, bob.accountAddress, perSecond);
    // Sleep to create a debt equivalent to one second
    let sleepFor = poolAmount + 2 * perSecond;
    // Sleep a while extra to make sure we don't round down
    await sleep(sleepFor * 1000);
    // Settle the pool
    let poolAddress = await getPoolAddress(alice, Tokens.APT);
    await closeStream(alice, poolAddress, streamId);
    let newBalance = await aptos.account.getAccountAPTAmount(bob);
    // All of the pool would be paid to settle and would leave a debt
    expect(newBalance - oldBalance).toBe(poolAmount);
    const pool = await getPoolObject(alice, Tokens.APT);
    const updatedLastBalance = parseInt(pool["last_balance"]);
    const debt = pool["debts"][0];
    expect(debt).toBeDefined();
    expect(debt["destination"].substring(2).padStart(64, '0')).toBe(bob.accountAddress.toStringWithoutPrefix());
    expect(parseInt(debt["amount"])).toBe((updatedLastBalance - originalLastBalance) * perSecond - poolAmount);
}, 10000);

test("Create stream and withdraw to have debt", async () => {
    let alice = await createAccount();
    let bob = await createAccount();
    let poolAmount = 4;
    let perSecond = 1;
    let oldBalance = await aptos.account.getAccountAPTAmount(bob);

    await createPool({account: alice, poolAmount: poolAmount});
    let streamId = await startStream(alice, Tokens.APT, bob.accountAddress, perSecond);
    // Sleep to create a debt equivalent to one second
    let sleepFor = poolAmount + perSecond;
    // Sleep a while extra to make sure we don't round down
    await sleep(sleepFor * 1000);
    // Settle the pool
    let poolAddress = await getPoolAddress(alice, Tokens.APT);
    await makeWithdrawal(alice, poolAddress, streamId);
    let newBalance = await aptos.account.getAccountAPTAmount(bob);
    // All of the pool would be paid to settle and would leave a debt
    expect(newBalance - oldBalance).toBe(poolAmount);
}, 10000);