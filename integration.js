import { cliffnetOptions, evmosTestnetOptions, osmoTestnetOptions } from "./testnetOptions.js"

import Web3 from "web3"
import fetch from "node-fetch"
import Long from "long"
import util from "util"
import DotenvConfigOptions  from "dotenv"
import { ethToEvmos, evmosToEth } from "@tharsis/address-converter"
import { generateEndpointBroadcast, generatePostBodyBroadcast, generateEndpointAccount } from '@tharsis/provider'
import { createTxRawEIP712, signatureToWeb3Extension, createMessageSend, createTxIBCMsgTransfer } from '@tharsis/transactions'
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { QueryClient, setupBankExtension, setupIbcExtension,  } from "@cosmjs/stargate"
import { Tendermint34Client } from "@cosmjs/tendermint-rpc"
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing"
import { signTypedData, SignTypedDataVersion } from "@metamask/eth-sig-util"

DotenvConfigOptions.config({ path: './app.env'})


/*-----NETWORKS------*/
// GOERLI
const goerliJsonRpcUrl = "https://goerli.prylabs.net"
// EVMOS
const evmosHttpUrl = evmosTestnetOptions.httpUrl
const evmosJsonRpcUrl = evmosTestnetOptions.jsonRpcUrl
const evmosRpcUrl = evmosTestnetOptions.rpcUrl
// WASM
const wasmHttpUrl = cliffnetOptions.lcdUrl
const wasmRpcUrl = cliffnetOptions.httpUrl
// OSMOSIS
const osmoHttpUrl = osmoTestnetOptions.httpUrl
const osmoRpcUrl = osmoTestnetOptions.rpcUrl

/*-----CLIENTS------*/
const tm_clients = await Promise.all([
    Tendermint34Client.connect(evmosRpcUrl),
    Tendermint34Client.connect(wasmRpcUrl),
    Tendermint34Client.connect(osmoRpcUrl)
])
// GOERLI
const goerliWeb3 = new Web3(goerliJsonRpcUrl)
// EVMOS
const evmosWeb3 = new Web3(evmosJsonRpcUrl)
const evmosTmClient = tm_clients[0]
const evmosQueryClient = QueryClient.withExtensions(evmosTmClient, setupBankExtension, setupIbcExtension)
// WASM
const wasmTmClient = tm_clients[1]
const wasmQueryClient = QueryClient.withExtensions(wasmTmClient, setupBankExtension, setupIbcExtension)
// OSMOSIS
const osmoTmClient = tm_clients[2]
const osmoQueryClient = QueryClient.withExtensions(osmoTmClient, setupBankExtension, setupIbcExtension)

/*-----ACCOUNTS------*/
const mainMnemonic = process.env.mainBipMnemonic
// MAIN - eth
const mainEthAddress = process.env.mainEthAddress
const mainEthPrivKey = process.env.mainEthPrivKey
// async getting wallets
const main_wallets = await Promise.all([
    DirectSecp256k1HdWallet.fromMnemonic(mainMnemonic, { hdPaths: [cliffnetOptions.hdPath], prefix: cliffnetOptions.bech32prefix }),
    DirectSecp256k1HdWallet.fromMnemonic(mainMnemonic, { prefix: osmoTestnetOptions.bech32prefix }),
])
// async getting accounts
const main_accounts = await Promise.all([
    main_wallets[0].getAccounts(),
    main_wallets[1].getAccounts()
])
// async getting clients
const main_signing_clients = await Promise.all([
    SigningCosmWasmClient.connectWithSigner(wasmRpcUrl, main_wallets[0]),
    SigningCosmWasmClient.connectWithSigner(osmoRpcUrl, main_wallets[1]),
])
// MAIN - evmos
const mainEvmosAddress = ethToEvmos(mainEthAddress)
// MAIN - wasm
const mainWasmWallet = main_wallets[0]
const [mainWasmAccount] = main_accounts[0]
const mainWasmAddress = mainWasmAccount.address
const mainWasmSigningClient = main_signing_clients[0]
// MAIN - osmosis
const mainOsmoWallet = main_wallets[1]
const [mainOsmoAccount] = main_accounts[1]
const mainOsmoAddress = mainOsmoAccount.address
const mainOsmoSigningClient = main_signing_clients[1]

const transferAmount = (amount) => {
    return (amount * Number(1000000000000000000n)).toString()
}

const evmosTransfer = async (senderAddress, senderPrivKey, recipientAddress, amount) => {
    const fetchOptions = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json'}
    }

    const senderAddressRawData = await fetch(`${evmosHttpUrl}${generateEndpointAccount(senderAddress)}`, fetchOptions)
    const senderAddressData = await senderAddressRawData.json()

    const chain = {
        chainId: evmosTestnetOptions.chainId,
        cosmosChainId: evmosTestnetOptions.networkId
    }
    const sender = {
        accountAddress: senderAddress,
        sequence: senderAddressData.account.base_account.sequence,
        accountNumber: senderAddressData.account.base_account.account_number,
        pubkey: senderAddressData.account.base_account.pub_key.key,
        privKey: Buffer.from(senderPrivKey, 'hex')
    }
    const fee = {
        amount: '20',
        denom: evmosTestnetOptions.denom,
        gas: '200000',
    }
    const memo = ''
    const params = {
        destinationAddress: recipientAddress,
        amount: transferAmount(amount),
        denom: evmosTestnetOptions.denom,
    }

    const msg = createMessageSend(chain, sender, fee, memo, params)
    const signature = signTypedData({ privateKey: sender.privKey, data: msg.eipToSign, version: SignTypedDataVersion.V4 })
    const extension = signatureToWeb3Extension(chain, sender, signature)
    const rawTx = createTxRawEIP712(msg.legacyAmino.body, msg.legacyAmino.authInfo, extension)
    
    const postOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: generatePostBodyBroadcast(rawTx),
    }

    const broadcastPostResponseRaw = await fetch(`${evmosHttpUrl}${generateEndpointBroadcast()}`, postOptions)
    const broadcastPostResponse = broadcastPostResponseRaw.json()
    console.log(broadcastPostResponse)
}


const evmosOsmoIbcTransfer = async (senderAddress, senderPrivKey, recipientAddress, amount) => {
    const fetchOptions = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json'}
    }

    const a = await Promise.all([
        (await fetch(`${evmosHttpUrl}${generateEndpointAccount(senderAddress)}`, fetchOptions)).json(),
        evmosQueryClient.ibc.channel.channel("transfer", "channel-8"),
        mainOsmoSigningClient.getHeight(),
    ])

    const senderAddressData = a[0]
    const ibcChannelData = a[1]

    const chain = {
        chainId: evmosTestnetOptions.chainId,
        cosmosChainId: evmosTestnetOptions.networkId
    }
    const sender = {
        accountAddress: senderAddress,
        sequence: senderAddressData.account.base_account.sequence,
        accountNumber: senderAddressData.account.base_account.account_number,
        pubkey: senderAddressData.account.base_account.pub_key.key,
        privKey: Buffer.from(senderPrivKey, 'hex')
    }
    const fee = {
        amount: '20',
        denom: evmosTestnetOptions.denom,
        gas: '200000',
    }
    const memo = ''
    const params = {
        receiver: recipientAddress,
        amount: transferAmount(amount),
        denom: evmosTestnetOptions.denom,
        sourceChannel: "channel-8",
        sourcePort: "transfer",
        revisionHeight: a[2] + 50,
        revisionNumber: ibcChannelData.proofHeight.revisionNumber.toNumber(),
        timeoutTimestamp: Long.fromNumber(Date.now() / 1000 + 60).multiply(1e9).toString()
    }

    const msg = createTxIBCMsgTransfer(chain, sender, fee, memo, params)
    const signature = signTypedData({ privateKey: sender.privKey, data: msg.eipToSign, version: SignTypedDataVersion.V4 })
    const extension = signatureToWeb3Extension(chain, sender, signature)
    const rawTx = createTxRawEIP712(msg.legacyAmino.body, msg.legacyAmino.authInfo, extension)
    
    const postOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: generatePostBodyBroadcast(rawTx),
    }

    const broadcastPostResponseRaw = await fetch(`${evmosHttpUrl}${generateEndpointBroadcast()}`, postOptions)
    const broadcastPostResponse = await broadcastPostResponseRaw.json()
    console.log(broadcastPostResponse)
}

const prettyPrint = obj => {
    return util.inspect(obj, null, 2, true)
}

const main_balances = await Promise.all([
    evmosWeb3.eth.getBalance(mainEthAddress),
    evmosQueryClient.bank.allBalances(mainEvmosAddress),
    osmoQueryClient.bank.allBalances(mainOsmoAddress)
])

console.log("Main Eth Addr: " + mainEthAddress)
console.log("Evmos Web3 Balance " + prettyPrint(main_balances[0]))
console.log("Main Evmos Addr: " + mainEvmosAddress)
console.log("Evmos Cosmos Balance " + prettyPrint(main_balances[1]))
console.log("Main Osmo Addr: " + mainOsmoAddress)
console.log("Osmo Balance " + prettyPrint(main_balances[2]))

// const ibc_channels = await Promise.all([
//     evmosQueryClient.ibc.channel.channel('transfer', 'channel-8'),
//     osmoQueryClient.ibc.channel.channel('transfer', 'channel-242'),
// ])

// console.log(prettyPrint(ibc_channels[0]))
// console.log(prettyPrint(ibc_channels[1]))

evmosOsmoIbcTransfer(mainEvmosAddress, mainEthPrivKey, mainOsmoAddress, 0.001)
