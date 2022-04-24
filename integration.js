/**
 * // Setup metamask wallet with some fake tokens
 * // Attach to web3.js
 * TODO Bring assets from eth to evmos (hmmmm)
 * TODO Bring assets from evmos to wasm (IBC transfer prob)
 * // Setup eth signer (alchemy web3? --> metamask signer)
 * //  setup cosmos signer with cosmjs
 * TODO Setup local evm node (geth?)
 */

import { pebblenetOptions } from "./walletHelper.js"

import Web3 from "web3"
import fetch from "node-fetch"

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
const evmosJsonRpcUrl = "http://0.0.0.0:8545"
const web3 = new Web3(evmosJsonRpcUrl)
// EVMOS
const evmosHttpUrl = "http://0.0.0.0:1317"
const evmosRpcUrl = "tcp://0.0.0.0:26657"
const evmosTmClient = await Tendermint34Client.connect(evmosRpcUrl)
const evmosQueryClient = QueryClient.withExtensions(evmosTmClient, setupBankExtension)
// WASM
const wasmRpcUrl = pebblenetOptions.httpUrl
const wasmTmClient = await Tendermint34Client.connect(wasmRpcUrl)
const wasmQueryClient = QueryClient.withExtensions(wasmTmClient, setupBankExtension)


/* TEST WALLETS + ACCOUNTS */
const testMnemonic = "hand flavor weasel connect valley debris like useful exile machine faculty join eager catch hospital banner bus enjoy course print kitten poverty inner section" // ! will need to be stored in some db
// ETH
const ethTestAddress = "0xAf61b4b63B8B8406bC0C8186299b46ea166a44E0"
const ethTestPrivKey = "a1bf8edafe42bcac098d411e91d2e455a6f60a1217a5db27cf91de46b925b118"
const ethTestWallet = web3.eth.accounts.wallet.add(ethTestPrivKey)
// EVMOS
const evmosTestAddress = ethToEvmos(ethTestAddress)
// WASM
const wasmTestWallet = await DirectSecp256k1HdWallet.fromMnemonic(testMnemonic, { hdPaths: [pebblenetOptions.hdPath], prefix: pebblenetOptions.bech32prefix })
const [wasmTestAccount] = await wasmTestWallet.getAccounts()
const wasmTestAddress = wasmTestAccount.address
wasmTestAccount.pubkey
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
console.log("ethTestBank: " + await web3.eth.getBalance(ethTestAddress))
console.log("ethMainBank: " + await web3.eth.getBalance(ethMainAddress))
console.log(`Transaction Count - Test Account: ${await web3.eth.getTransactionCount(ethTestAddress)}`)
console.log(`Transaction Count - Main Account: ${await web3.eth.getTransactionCount(ethMainAddress)}`)


const evmosTransaction = async () => {
const chain = {
    chainId: 9000,
    cosmosChainId: 'evmos_9000-1',
}
const sender = {
    accountAddress: evmosTestAddress,
    sequence: 7,
    accountNumber: 0,
    pubkey: 'A9qXeXtq2mElT9aGEeUX/eJWzgnP58wdV/70MiWS2/G8', // // get public key
    privKey: Buffer.from('a1bf8edafe42bcac098d411e91d2e455a6f60a1217a5db27cf91de46b925b118', 'hex') // ! get priv key
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
    console.log(SignTypedDataVersion.V4)
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
// evmosTransaction()

