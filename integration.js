import { cliffnetOptions } from "./walletHelper.js"

import Web3 from "web3"
import fetch from "node-fetch"
import DotenvConfigOptions  from "dotenv"
DotenvConfigOptions.config({ path: './app.env'})

import { ethToEvmos, evmosToEth } from "@tharsis/address-converter"
import { generateEndpointBroadcast, generatePostBodyBroadcast, generateEndpointAccount } from '@tharsis/provider'
import { createTxRawEIP712, signatureToWeb3Extension, createMessageSend } from '@tharsis/transactions'

import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { QueryClient, setupBankExtension,  } from "@cosmjs/stargate"
import { Tendermint34Client } from "@cosmjs/tendermint-rpc"
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing"

import { signTypedData, SignTypedDataVersion } from "@metamask/eth-sig-util"

/* CLIENTS */
// ETH
const ethJsonRpcUrl = `https://goerli.infura.io/v3/${process.env.infurio_id}`
const ethWeb3 = new Web3(ethJsonRpcUrl)
// EVMOS
const evmosJsonRpcUrl = "http://0.0.0.0:8545"
const evmosHttpUrl = "http://0.0.0.0:1317"
const evmosRpcUrl = "tcp://0.0.0.0:26657"
const evmosWeb3 = new Web3(evmosJsonRpcUrl)
const evmosTmClient = await Tendermint34Client.connect(evmosRpcUrl)
const evmosQueryClient = QueryClient.withExtensions(evmosTmClient, setupBankExtension)
// WASM
const wasmHttpUrl = cliffnetOptions.lcdUrl // // haven't spun up yet
const wasmRpcUrl = cliffnetOptions.httpUrl
const wasmTmClient = await Tendermint34Client.connect(wasmRpcUrl)
const wasmQueryClient = QueryClient.withExtensions(wasmTmClient, setupBankExtension)


/* TEST WALLETS + ACCOUNTS */
const testMnemonic = "hand flavor weasel connect valley debris like useful exile machine faculty join eager catch hospital banner bus enjoy course print kitten poverty inner section" // ! will need to be stored in some db
// ETH
const ethTestAddress = "0x8c1Fc905C8623a8f136f8C0a5b940f9FD98F472c"
const ethTestPrivKey = "725AD2FD3F644B31EA3C4F1B307DB8F92101269DBE9006FA38F0BA4C7BE8B5F4"
// EVMOS
const evmosTestAddress = ethToEvmos(ethTestAddress)
// WASM
const wasmTestWallet = await DirectSecp256k1HdWallet.fromMnemonic(testMnemonic, { hdPaths: [cliffnetOptions.hdPath], prefix: cliffnetOptions.bech32prefix })
const [wasmTestAccount] = await wasmTestWallet.getAccounts()
const wasmTestAddress = wasmTestAccount.address
const wasmClient = await SigningCosmWasmClient.connectWithSigner(wasmRpcUrl, wasmTestWallet);


/* MAIN WALLETS + ACCOUNTS */
// ETH
const ethMainAddress = "0xDCFFe3264d4219b1C0DC39EDe7fc2af93B5E01F8"
// EVMOS
const evmosMainAddress = ethToEvmos(ethMainAddress)


console.log(`ethTestAddress: ${ethTestAddress}`)
console.log(`evmosTestAddress: ${evmosTestAddress}`)
console.log(`wasmTestAddress: ${wasmTestAddress}`)
console.log("evmosTestBank: " + JSON.stringify(await evmosQueryClient.bank.allBalances(evmosTestAddress)))
console.log("evmosMainBank: " + JSON.stringify(await evmosQueryClient.bank.allBalances(evmosMainAddress)))
console.log("wasmMainBank: " + JSON.stringify(await wasmQueryClient.bank.allBalances(wasmTestAddress)))
console.log("ethTestBank: " + await ethWeb3.eth.getBalance(ethTestAddress))
console.log("ethMainBank: " + await ethWeb3.eth.getBalance(ethMainAddress))
console.log(`Transaction Count - Test Account: ${await evmosWeb3.eth.getTransactionCount(ethTestAddress)}`)
console.log(`Transaction Count - Main Account: ${await evmosWeb3.eth.getTransactionCount(ethMainAddress)}`)


const evmosTransaction = async () => {
const chain = {
    chainId: 9000,
    cosmosChainId: 'evmos_9000-1',
}
const sender = {
    accountAddress: evmosTestAddress,
    sequence: 1,
    accountNumber: 0,
    pubkey: 'A1Do/MPAsMi/Sk6vvncVRAxGLAIpLCUpD2hgYIy7fiU6', // // get public key
    privKey: Buffer.from(ethTestPrivKey, 'hex') // // get priv key
}
const fee = {
    amount: '20',
    denom: 'aevmos',
    gas: '200000',
}
const memo = ''
const params = {
    destinationAddress: evmosMainAddress,
    amount: '1500000000000000000000000',
    denom: 'aevmos',
}
    const msg = createMessageSend(chain, sender, fee, memo, params)
    let signature = signTypedData({privateKey: sender.privKey, data: msg.eipToSign, version: SignTypedDataVersion.V4})
    let extension = signatureToWeb3Extension(chain, sender, signature)

    let rawTx = createTxRawEIP712(msg.legacyAmino.body, msg.legacyAmino.authInfo, extension)
    const postOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: generatePostBodyBroadcast(rawTx),
    }
    let broadcastPost = await fetch(
        `${evmosHttpUrl}${generateEndpointBroadcast()}`,
        postOptions
    )
    let response = await broadcastPost.json();
    console.log(response)
}