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

async function getINTAddress() : Promise<`0x${string}`> {
    const result = await aptos.view({
        payload: {
            function: `${deployerAccount.accountAddress}::inertia_coin::get_metadata`,
            functionArguments: [],
        }
    });

    const addr =  (result[0] as Object).inner || "";
    if (!addr.startsWith("0x")) throw new Error("Invalid INT address");
    return addr as `0x${string}`;
}

const Tokens : { APT: `0x${string}`; INT: `0x${string}` } = {
    APT: "0xa", INT: "0x0",
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

async function mintINT(signer: Ed25519Account, account: Ed25519Account) {
    const transaction = await aptos.transaction.build.simple({
        sender: signer.accountAddress,
        data: {
            function: `${deployerAccount.accountAddress}::inertia_coin::mint`,
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
    await mintINT(deployerAccount, account);
    return account;
}

async function getPoolAddress(account: Ed25519Account, token: string) : Promise<`0x${string}`> {
    const result = await aptos.view({
        payload: {
            function: `${deployerAccount.accountAddress}::streams::vault_address`,
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
    const vaultAddress = await getPoolAddress(account, token);
    let type = `${deployerAccount.accountAddress}::streams::Pool<0x1::object::Object<0x1::fungible_asset::Metadata>>`;

    // @ts-ignore
    return await aptos.getAccountResource({accountAddress: vaultAddress, resourceType: type});
}

async function createPool({account, vaultAmount, name = "Pool", token = Tokens.APT}: {
    account: Ed25519Account,
    vaultAmount: number,
    name?: string,
    token?: string
}) {

    let oldBalance = await getFungibleAssetBalance(account, token);
    const transaction = await aptos.transaction.build.simple({
        sender: account.accountAddress,
        data: {
            function: `${deployerAccount.accountAddress}::streams::create_vault`,
            functionArguments: [name, token, vaultAmount],
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
    expect(newBalance).toBe(oldBalance - vaultAmount - gasCost);

    return await getPoolObject(account, token);
}

async function viewPool(account: Ed25519Account, token: string) : Promise<PoolView> {
    const vaultAddr = await getPoolAddress(account, token);
    let vaultAddress = vaultAddr?.toString() || "";

    const result = await aptos.view({
        payload: {
            function: `${deployerAccount.accountAddress}::streams::view_vault`,
            functionArguments: [vaultAddress],
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

async function settlePool(account: Ed25519Account, vaultAddress: string) {
    const transaction = await aptos.transaction.build.simple({
        sender: account.accountAddress,
        data:{
            function: `${deployerAccount.accountAddress}::streams::settle_vault`,
            functionArguments: [vaultAddress],
            typeArguments: ["0x1::fungible_asset::Metadata"],
        }
    });
    const pendingTransaction = await aptos.signAndSubmitTransaction({signer: account, transaction});
    await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});
}

async function startStream({account, token, destination, perSecond, name = "Stream"}: {
    account: Ed25519Account,
    token: string,
    destination: AccountAddress,
    perSecond: number,
    name?: string
}) : Promise<string> {
    const transaction = await aptos.transaction.build.simple({
        sender: account.accountAddress,
        data:{
            function: `${deployerAccount.accountAddress}::streams::start_stream`,
            functionArguments: [name, token, destination, perSecond],
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
    Tokens.INT = await getINTAddress();
}, 60000);

test("Create a vault", async () => {
    let vaultAmount = 100;
    let alice = await createAccount();
    const vaultObject = await createPool({account: alice, vaultAmount: vaultAmount});
    const availableStoreAddress = vaultObject["available"]["store"]["inner"];
    const availableStore = await aptos.getAccountResource({accountAddress: availableStoreAddress, resourceType: "0x1::fungible_asset::FungibleStore"});
    expect(parseInt(availableStore["balance"])).toBe(vaultAmount);

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

test("Drain from the vault", async () => {
    // Create the vault
    let vaultAmount = 100;
    let alice = await createAccount();
    let vaultObject = await createPool({account: alice, vaultAmount: vaultAmount});

    let drainAmount = 50;
    let oldBalance = await aptos.account.getAccountAPTAmount(alice);
    // Drain the vault
    const transaction = await aptos.transaction.build.simple({
        sender: alice.accountAddress,
        data:{
            function: `${deployerAccount.accountAddress}::streams::drain_vault`,
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

    // Verify assets have left the vault
    const availableStoreAddress = vaultObject["available"]["store"]["inner"];
    const availableStore = await aptos.getAccountResource({accountAddress: availableStoreAddress, resourceType: "0x1::fungible_asset::FungibleStore"});
    expect(availableStore["balance"]).toBe((vaultAmount - drainAmount).toString());
});

test("Excess Drain from the vault", async () => {

    let alice = await createAccount();
    let vaultAmount = 100;
    await createPool({account: alice, vaultAmount: vaultAmount});

    try {
        let drainAmount = vaultAmount + 1;
        // Drain the vault
        const transaction = await aptos.transaction.build.simple({
            sender:alice.accountAddress,
            data: {
                function: `${deployerAccount.accountAddress}::streams::drain_vault`,
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

test("Credit the vault", async () => {

    let alice = await createAccount();
    let vaultAmount = 100;
    let vaultObject = await createPool({account: alice, vaultAmount: vaultAmount});

    const vaultAddr = await getPoolAddress(alice, Tokens.APT);
    let vaultAddress = vaultAddr?.toString() || "";

    let creditAmount = 50;
    let accounts = [
        await createAccount(),
        await createAccount(),
        await createAccount()
    ];

    for (const account of accounts) {
        let oldBalance = await aptos.account.getAccountAPTAmount(account);
        // Credit the vault
        const transaction = await aptos.transaction.build.simple({
            sender: account.accountAddress,
            data:{
                function: `${deployerAccount.accountAddress}::streams::credit_vault`,
                functionArguments: [vaultAddress, Tokens.APT, creditAmount],
                typeArguments: ["0x1::fungible_asset::Metadata"],
            }
        });
        const pendingTransaction = await aptos.signAndSubmitTransaction({signer: account, transaction});
        const executedTransaction = await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});
        const gasCost = parseInt(executedTransaction.gas_used) * (await aptos.getGasPriceEstimation()).gas_estimate;

        let newBalance = await aptos.account.getAccountAPTAmount(account);
        expect(newBalance).toBe(oldBalance - creditAmount - gasCost);

        const availableStoreAddress = vaultObject["available"]["store"]["inner"];
        const availableStore = await aptos.getAccountResource({accountAddress: availableStoreAddress, resourceType: "0x1::fungible_asset::FungibleStore"});
        vaultAmount += creditAmount;
        expect(availableStore["balance"]).toBe(vaultAmount.toString());
    }
}, 30000);

test("View a vault", async () => {

    let alice = await createAccount();
    let vaultAmount = 100;
    let name = "Payroll";
    await createPool({account: alice, vaultAmount: vaultAmount, name});
    let vaultView = await viewPool(alice, Tokens.APT);

    expect(vaultView.name).toBe(name);
    expect(vaultView.available).toBe(vaultAmount);
    expect(vaultView.committed).toBe(0);
});

test("Create multiple vaults", async () => {
    // Create the vault
    let vaultAmount = 100;

    let tokens = [Tokens.APT, Tokens.INT];
    let accounts = [
        await createAccount(),
        await createAccount(),
        await createAccount()
    ];

    for (const token of tokens) {
        for (const account of accounts) {
            await createPool({account: account, vaultAmount: vaultAmount, token});
            let vaultView = await viewPool(account, token);

            expect(vaultView.available).toBe(vaultAmount);
            expect(vaultView.committed).toBe(0);
        }
    }
}, 30000);

test("Create stream", async () => {

    let alice = await createAccount();
    let bob = await createAccount();
    let vaultAmount = 100;
    let perSecond = 10;

    await createPool({account: alice, vaultAmount: vaultAmount});

    await startStream({account: alice, token: Tokens.APT, destination: bob.accountAddress, perSecond: perSecond});

    const vaultObject = await getPoolObject(alice, Tokens.APT);
    const originalLastBalance = parseInt(vaultObject["balance_updated"]);
    expect(vaultObject["streams"]["data"].length).toBe(1);
    let stream = vaultObject["streams"]["data"][0]["value"];
    expect(stream["destination"].substring(2).padStart(64, '0')).toBe(bob.accountAddress.toStringWithoutPrefix());
    expect(parseInt(stream["per_second"])).toBe(perSecond);
    let vaultAddress = await getPoolAddress(alice, Tokens.APT);
    expect(stream["vault"]).toBe(vaultAddress);

    let sleepFor = 5;
    await sleep(sleepFor * 1000);

    // Settle the vault
    await settlePool(alice, vaultAddress);

    // Check we have now the amount committed
    let vaultView = await viewPool(alice, Tokens.APT);

    const time = vaultView.lastBalance - originalLastBalance;
    expect(vaultView.committed).toBe(time * perSecond);
    expect(vaultView.available).toBe(vaultAmount - time * perSecond);

}, 10000);

async function makeWithdrawal(account: Ed25519Account, vaultAddress: string, streamId: string) {
    const transaction = await aptos.transaction.build.simple({
        sender: account.accountAddress,
        data:{
            function: `${deployerAccount.accountAddress}::streams::make_withdrawal_from_stream`,
            functionArguments: [vaultAddress, new FixedBytes(streamId).value],
            typeArguments: ["0x1::fungible_asset::Metadata"],
        }
    });

    const pendingTransaction = await aptos.signAndSubmitTransaction({signer: account, transaction});
    await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});
}

async function closeStream(account: Ed25519Account, vaultAddress: string, streamId: string) {
    const transaction = await aptos.transaction.build.simple({
        sender: account.accountAddress,
        data:{
            function: `${deployerAccount.accountAddress}::streams::close_stream`,
            functionArguments: [vaultAddress, new FixedBytes(streamId).value],
            typeArguments: ["0x1::fungible_asset::Metadata"],
        }
    });

    const pendingTransaction = await aptos.signAndSubmitTransaction({signer: account, transaction});
    await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});
}

test("Create stream and withdraw", async () => {

    let alice = await createAccount();
    let bob = await createAccount();
    let vaultAmount = 100;
    let perSecond = 1;
    let oldBalance = await aptos.account.getAccountAPTAmount(bob);

    let vaultObject = await createPool({account: alice, vaultAmount: vaultAmount});
    const originalLastBalance = parseInt(vaultObject["balance_updated"]);
    let streamId = await startStream({
        account: alice,
        token: Tokens.APT,
        destination: bob.accountAddress,
        perSecond: perSecond
    });
    let sleepFor = 5;
    // Sleep a while extra to make sure we don't round down
    await sleep(sleepFor * 1000);
    let vaultAddress = await getPoolAddress(alice, Tokens.APT);
    await makeWithdrawal(alice, vaultAddress, streamId);
    let vaultView = await viewPool(alice, Tokens.APT);
    sleep(500);
    let newBalance = await aptos.account.getAccountAPTAmount(bob);
    expect(newBalance - oldBalance).toBe((vaultView.lastBalance - originalLastBalance) * perSecond);

}, 10000);

test("Create stream and close", async () => {
    let alice = await createAccount();
    let bob = await createAccount();
    let vaultAmount = 100;
    let perSecond = 1;
    let oldBalance = await aptos.account.getAccountAPTAmount(bob);

    let vaultObject = await createPool({account: alice, vaultAmount: vaultAmount});
    const originalLastBalance = parseInt(vaultObject["balance_updated"]);
    let streamId = await startStream({
        account: alice,
        token: Tokens.APT,
        destination: bob.accountAddress,
        perSecond: perSecond
    });
    let sleepFor = 5;
    // Sleep a while extra to make sure we don't round down
    await sleep(sleepFor * 1000);
    let vaultAddress = await getPoolAddress(alice, Tokens.APT);
    await closeStream(alice, vaultAddress, streamId);
    let vaultView = await viewPool(alice, Tokens.APT);
    let newBalance = await aptos.account.getAccountAPTAmount(bob);
    expect(newBalance - oldBalance).toBe((vaultView.lastBalance - originalLastBalance) * perSecond);

}, 10000);

test("Create stream and cancel to have debt", async () => {
    let alice = await createAccount();
    let bob = await createAccount();
    let vaultAmount = 4;
    let perSecond = 1;
    let oldBalance = await aptos.account.getAccountAPTAmount(bob);

    let vaultObject = await createPool({account: alice, vaultAmount: vaultAmount});
    const originalLastBalance = parseInt(vaultObject["balance_updated"]);
    let streamId = await startStream({
        account: alice,
        token: Tokens.APT,
        destination: bob.accountAddress,
        perSecond: perSecond
    });
    // Sleep to create a debt equivalent to one second
    let sleepFor = vaultAmount + 2 * perSecond;
    // Sleep a while extra to make sure we don't round down
    await sleep(sleepFor * 1000);
    // Settle the vault
    let vaultAddress = await getPoolAddress(alice, Tokens.APT);
    await closeStream(alice, vaultAddress, streamId);
    let newBalance = await aptos.account.getAccountAPTAmount(bob);
    // All of the vault would be paid to settle and would leave a debt
    expect(newBalance - oldBalance).toBe(vaultAmount);
    const vault = await getPoolObject(alice, Tokens.APT);
    const updatedLastBalance = parseInt(vault["balance_updated"]);
    const debt = vault["debts"][0];
    expect(debt).toBeDefined();
    expect(debt["destination"].substring(2).padStart(64, '0')).toBe(bob.accountAddress.toStringWithoutPrefix());
    expect(parseInt(debt["amount"])).toBe((updatedLastBalance - originalLastBalance) * perSecond - vaultAmount);
}, 10000);

test("Create stream and withdraw to have debt", async () => {
    let alice = await createAccount();
    let bob = await createAccount();
    let vaultAmount = 4;
    let perSecond = 1;
    let oldBalance = await aptos.account.getAccountAPTAmount(bob);

    await createPool({account: alice, vaultAmount: vaultAmount});
    let streamId = await startStream({
        account: alice,
        token: Tokens.APT,
        destination: bob.accountAddress,
        perSecond: perSecond
    });
    // Sleep to create a debt equivalent to one second
    let sleepFor = vaultAmount + perSecond;
    // Sleep a while extra to make sure we don't round down
    await sleep(sleepFor * 1000);
    // Settle the vault
    let vaultAddress = await getPoolAddress(alice, Tokens.APT);
    await makeWithdrawal(alice, vaultAddress, streamId);
    let newBalance = await aptos.account.getAccountAPTAmount(bob);
    // All of the vault would be paid to settle and would leave a debt
    expect(newBalance - oldBalance).toBe(vaultAmount);
}, 10000);