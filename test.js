import { cliffnetOptions, evmosTestnetOptions, evmosTestnetLocalOptions } from "./walletHelper.js"

import Web3 from "web3"
import fetch from "node-fetch"
import DotenvConfigOptions  from "dotenv"
import { ethToEvmos, evmosToEth } from "@tharsis/address-converter"
import { generateEndpointBroadcast, generatePostBodyBroadcast, generateEndpointAccount } from '@tharsis/provider'
import { createTxRawEIP712, signatureToWeb3Extension, createMessageSend } from '@tharsis/transactions'
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { QueryClient, setupBankExtension,  } from "@cosmjs/stargate"
import { Tendermint34Client } from "@cosmjs/tendermint-rpc"
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing"
import { signTypedData, SignTypedDataVersion } from "@metamask/eth-sig-util"

DotenvConfigOptions.config({ path: './app.env'})

// ETH
const ethAddress = process.env.ethAddress
const ethEvmosAddress = ethToEvmos(process.env.ethAddress)
const ethJsonRpcUrl = `https://goerli.infura.io/v3/${process.env.infurio_id}`
const ethWeb3 = new Web3(ethJsonRpcUrl)

// EVMOS
const evmosHttpUrl = evmosTestnetLocalOptions.httpUrl
const evmosJsonRpcUrl = evmosTestnetLocalOptions.jsonRpcUrl
const evmosRpcUrl = evmosTestnetLocalOptions.rpcUrl
const evmosEthAddress = process.env.evmosEthAddress
const evmosAddress = ethToEvmos(evmosEthAddress)
const evmosEthPrivKey = process.env.evmosEthPrivKey

const evmosTmClient = await Tendermint34Client.connect(evmosRpcUrl)
const evmosQueryClient = QueryClient.withExtensions(evmosTmClient, setupBankExtension)

const evmosWeb3 = new Web3(evmosJsonRpcUrl)

// WASM
const wasmMnemonic = process.env.wasmMnemonic
const wasmHttpUrl = cliffnetOptions.lcdUrl
const wasmRpcUrl = cliffnetOptions.httpUrl

const wasmTmClient = await Tendermint34Client.connect(wasmRpcUrl)
const wasmQueryClient = QueryClient.withExtensions(wasmTmClient, setupBankExtension)

const wasmWallet = await DirectSecp256k1HdWallet.fromMnemonic(wasmMnemonic, { hdPaths: [cliffnetOptions.hdPath], prefix: cliffnetOptions.bech32prefix })
const [wasmAccount] = await wasmWallet.getAccounts()
const wasmAddress = wasmAccount.address
const wasmClient = await SigningCosmWasmClient.connectWithSigner(wasmRpcUrl, wasmWallet)

const evmosTransaction = async (senderAddress, senderPrivKey, recipientAddress, amount) => {
    const fetchOptions = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json'}
    }

    const senderAddressRawData = await fetch(`${evmosHttpUrl}${generateEndpointAccount(senderAddress)}`, fetchOptions)
    const senderAddressData = await senderAddressRawData.json()

    const chain = {
        chainId: evmosTestnetLocalOptions.chainId,
        cosmosChainId: evmosTestnetLocalOptions.cosmosChainId
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
        denom: evmosTestnetLocalOptions.denom,
        gas: '200000',
    }
    const memo = ''
    const params = {
        destinationAddress: recipientAddress,
        amount: amount.toString(),
        denom: evmosTestnetLocalOptions.denom,
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

evmosTransaction(evmosAddress, evmosEthPrivKey, ethEvmosAddress, 150000000000000000000)