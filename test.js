import { cliffnetOptions, evmosTestnetOptions, osmoTestnetOptions } from "./walletHelper.js"

import Web3 from "web3"
import fetch from "node-fetch"
import Long from "long"
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

const mnemonic = process.env.mnemonic

// ETH
const ethAddress = process.env.ethAddress
const ethEvmosAddress = ethToEvmos(process.env.ethAddress)
const ethJsonRpcUrl = `https://goerli.infura.io/v3/${process.env.infurio_id}`
const ethWeb3 = new Web3(ethJsonRpcUrl)

// EVMOS
const evmosHttpUrl = evmosTestnetOptions.httpUrl
const evmosJsonRpcUrl = evmosTestnetOptions.jsonRpcUrl
const evmosRpcUrl = evmosTestnetOptions.rpcUrl
const evmosEthAddress = process.env.evmosEthAddress
const evmosAddress = ethToEvmos(evmosEthAddress)
const evmosEthPrivKey = process.env.evmosEthPrivKey

const evmosTmClient = await Tendermint34Client.connect(evmosRpcUrl)
const evmosQueryClient = QueryClient.withExtensions(evmosTmClient, setupBankExtension, setupIbcExtension)

const evmosWeb3 = new Web3(evmosJsonRpcUrl)

// WASM
const wasmHttpUrl = cliffnetOptions.lcdUrl
const wasmRpcUrl = cliffnetOptions.httpUrl

const wasmTmClient = await Tendermint34Client.connect(wasmRpcUrl)
const wasmQueryClient = QueryClient.withExtensions(wasmTmClient, setupBankExtension, setupIbcExtension)

const wasmWallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { hdPaths: [cliffnetOptions.hdPath], prefix: cliffnetOptions.bech32prefix })
const [wasmAccount] = await wasmWallet.getAccounts()
const wasmAddress = wasmAccount.address
const wasmClient = await SigningCosmWasmClient.connectWithSigner(wasmRpcUrl, wasmWallet)

// OSMO
const osmoHttpUrl = osmoTestnetOptions.httpUrl
const osmoRpcUrl = osmoTestnetOptions.rpcUrl

const osmoTmClient = await Tendermint34Client.connect(osmoRpcUrl)
const osmoQueryClient = QueryClient.withExtensions(osmoTmClient, setupBankExtension, setupIbcExtension)

const osmoWallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: osmoTestnetOptions.bech32prefix })
const [osmoAccount] = await osmoWallet.getAccounts()
const osmoAddress = osmoAccount.address
const osmoClient = await SigningCosmWasmClient.connectWithSigner(osmoRpcUrl, osmoWallet)

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
        pubkey: "A3F8Fl64kQ5KeE9w2WZNK6he/8NaRm7+O4UWbXiWyxY6",
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
    const broadcastPostResponse = await broadcastPostResponseRaw.json()
    console.log(broadcastPostResponse)
}

const evmosIbcTransfer = async (senderAddress, senderPrivKey, recipientAddress, amount) => {
    const fetchOptions = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json'}
    }

    const senderAddressRawData = await fetch(`${evmosHttpUrl}${generateEndpointAccount(senderAddress)}`, fetchOptions)
    const senderAddressData = await senderAddressRawData.json()

    const ibcChannelData = await evmosQueryClient.ibc.channel.channel("transfer", "channel-7")

    const chain = {
        chainId: evmosTestnetOptions.chainId,
        cosmosChainId: evmosTestnetOptions.networkId
    }
    const sender = {
        accountAddress: senderAddress,
        sequence: senderAddressData.account.base_account.sequence,
        accountNumber: senderAddressData.account.base_account.account_number,
        pubkey: "A3F8Fl64kQ5KeE9w2WZNK6he/8NaRm7+O4UWbXiWyxY6",
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
        revisionHeight: ibcChannelData.proofHeight.revisionHeight.add(Long.fromInt(150)).toNumber(),
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

console.log(evmosAddress)
console.log(await evmosQueryClient.bank.allBalances(evmosAddress))

console.log(osmoAddress)
console.log(await osmoQueryClient.bank.allBalances(osmoAddress))

// evmosTransfer(evmosAddress, evmosEthPrivKey, ethEvmosAddress, 0.01)