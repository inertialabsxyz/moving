import {Aptos, AptosConfig, Network, Account, AccountAddress, Ed25519Account} from "@aptos-labs/ts-sdk";
import * as dotenv from "dotenv";
import {deploy} from "./deploy";
const config = new AptosConfig({ network: Network.LOCAL });
const aptos = new Aptos(config);
const alice = Account.generate();
const bob = Account.generate();
const MINT_AMOUNT = 100_000_000;

function deployAddress(): string {
    dotenv.config({path: ".env.deploy.test"});
    return process.env.DEPLOY_ADDRESS || "0x1";
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

beforeAll(async () => {
    await deploy();
    await aptos.fundAccount({accountAddress: alice.accountAddress, amount: MINT_AMOUNT});
    await aptos.fundAccount({accountAddress: bob.accountAddress, amount: MINT_AMOUNT});
    await migrateAccountToFA(alice);
    await migrateAccountToFA(bob);
}, 30000);

// https://github.com/aptos-labs/aptos-ts-sdk/tree/main/examples/typescript
test("Create a pool", async () => {
    // aptos move run --function-id 17d1169c2f4e744ea21495510702cae3eba2230e928713bc07ae7c611cd1269b::streams::create_pool --type-args 0x1::fungible_asset::Metadata --args address:0xa u64:1000000
    const transaction = await aptos.transaction.build.simple({
        sender: alice.accountAddress,
        data: {
            function: `${deployAddress()}::streams::create_pool`,
            functionArguments: ["0xa", 100],
            typeArguments: ["0x1::fungible_asset::Metadata"],
        },
    });
    const pendingTransaction = await aptos.signAndSubmitTransaction({signer: alice, transaction});
    const executedTransaction = await aptos.waitForTransaction({transactionHash: pendingTransaction.hash});
    console.log(`Pool created:${executedTransaction.hash}`);
});