import {execSync} from "child_process";
import {Account, AccountAddress, Aptos, AptosApiType, AptosConfig, Ed25519Account, Network} from "@aptos-labs/ts-sdk";
import * as fs from "node:fs";
import * as path from "node:path";

const config = new AptosConfig({ network: Network.LOCAL });
const aptos = new Aptos(config);
const deployAccount = Account.generate();
const MINT_AMOUNT = 100_000_000;

function compilePackage(
    packageDir: string,
    outputFile: string,
    namedAddresses: Array<{ name: string; address: AccountAddress }>,
) {
    const addressArg = namedAddresses
        .map(({ name, address }) => `${name}=${address}`)
        .join(" ");
    // Assume-yes automatically overwrites the previous compiled version, only do this if you are sure you want to overwrite the previous version.
    const compileCommand = `aptos move build-publish-payload --json-output-file ${outputFile} --package-dir ${packageDir} --named-addresses ${addressArg} --assume-yes`;
    execSync(compileCommand, { stdio: "inherit" });
}

function getPackageBytesToPublish(filePath: string) {
    // current working directory - the root folder of this repo
    const cwd = process.cwd();
    // target directory - current working directory + filePath (filePath JSON file is generated with the previous, compilePackage, CLI command)
    const modulePath = path.join(cwd, filePath);

    const jsonData = JSON.parse(fs.readFileSync(modulePath, "utf8"));

    const metadataBytes = jsonData.args[0].value;
    const byteCode = jsonData.args[1].value;

    return { metadataBytes, byteCode };
}

async function deployInternal() {
    await aptos.fundAccount({accountAddress: deployAccount.accountAddress, amount: MINT_AMOUNT});
    const fileName = ".env.deploy.test";
    const contents =`DEPLOY_PRIVATE_KEY=${deployAccount.privateKey}\nDEPLOY_PUBLIC_KEY=${deployAccount.publicKey}\nDEPLOY_ADDRESS=${deployAccount.accountAddress}`
    console.log(`Saving to ${fileName}`);
    console.log(contents);
    fs.writeFileSync(fileName, contents);

    compilePackage("../", "inertia.json", [
        { name: "inertia", address: deployAccount.accountAddress },
    ]);
    const { metadataBytes, byteCode } = getPackageBytesToPublish(
        "inertia.json",
    );

    const transaction = await aptos.publishPackageTransaction({
        account: deployAccount.accountAddress,
        metadataBytes,
        moduleBytecode: byteCode,
    });

    const pendingTransaction = await aptos.signAndSubmitTransaction({
        signer: deployAccount,
        transaction,
    });

    await aptos.waitForTransaction({ transactionHash: pendingTransaction.hash });
}

function generateAbi() {
    const node = config.getRequestUrl(AptosApiType.FULLNODE);
    const contract_address = deployAccount.accountAddress;
    const module = "streams";
    const url = `${node}/accounts/${contract_address}/module/${module}`;
    const cmd = `echo \"export const ABI = $(curl ${url} | sed -n 's/.*\"abi\":\\({.*}\\).*}$/\\1/p') as const\" > abi.ts`;
    execSync(cmd, {stdio: "inherit"});
}

export async function deploy(): Promise<Ed25519Account> {
    await deployInternal();
    generateAbi();
    return deployAccount;
}


