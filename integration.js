/**
 * // Setup metamask wallet with some fake tokens
 * // Attach to web3.js
 * TODO Bring assets from eth to evmos
 * TODO Bring assets from evmos to cosmos
 * TODO Setup eth signer (alchemy web3?)
 * TODO setup cosmos signer with cosmjs
 * TODO Setup local evm node (geth?)
 */

/**
 * ethJsonRpc: http 8545 --> 8545
 * 
 * -----
 * evmosGRpc: http 9090 --> 9092
 * evmosRpc: tcp 26657 --> 26659
 * evmosJsonRpc: http 8545 --> 8847
 * -----
 * cosmosGRpc: http 9090 --> 9094
 * cosmosRpc: tcp 26657 --> 26661
 * cosmosRest: http 1317 --> 1321
 */

import Web3 from "web3"
import { ethToEvmos, evmosToEth } from "@tharsis/address-converter"
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { QueryClient, setupBankExtension,  } from "@cosmjs/stargate"
import { Tendermint34Client } from "@cosmjs/tendermint-rpc"
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing"


/* CLIENTS */
// ETH
const evmosJsonRpcUrl = "http://localhost:8545"
const web3 = new Web3(evmosJsonRpcUrl)
// EVMOS
const evmosRpcUrl = "tcp://0.0.0.0:26660"
const evmosTmClient = await Tendermint34Client.connect(evmosRpcUrl)
const evmosQueryClient = QueryClient.withExtensions(evmosTmClient, setupBankExtension)
// COSMOS
// const cosmosRpcUrl = ""
// const cosmosTmClient = await Tendermint34Client.connect(cosmosRpcUrl)
// const cosmotQueryClient = QueryClient.withExtensions(cosmosTmClient, setupBankExtension)

/* TEST WALLETS + ACCOUNTS */
// ETH
const ethTestAddress = "0xd04DD171C053c37dCbf3ca7E7E03caD9E87198E0"
const ethTestPrivKey = "fe7992530904e3c74374aa4fe602c6c0d6d7267266819de2f5547ee1e7ee8bbb"
const ethTestWallet = web3.eth.accounts.wallet.add(ethTestPrivKey)
// EVMOS
const evmosTestAddress = ethToEvmos(ethTestAddress)
// COSMOS
const cosmosTestMnemonic = "dog praise gorilla actor idea aerobic balcony shoe help syrup used viable plastic riot river cricket crawl dune outside lava cinnamon bounce coconut lobster" // ! will need to be stored in some db
const cosmosTestWallet = await DirectSecp256k1HdWallet.fromMnemonic(cosmosTestMnemonic)
const [cosmosTestAccount] = await cosmosTestWallet.getAccounts()
const cosmosTestAddress = cosmosTestAccount.address


/* MAIN WALLETS + ACCOUNTS */
// ETH
const ethMainAddress = "0xDCFFe3264d4219b1C0DC39EDe7fc2af93B5E01F8"
// EVMOS
const evmosMainAddress = ethToEvmos(ethMainAddress)

const options = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
}

console.log(`ethTestAddress: ${ethTestAddress}`)
console.log(`evmosTestAddress: ${evmosTestAddress}`)
console.log(`cosmosTestAddress: ${cosmosTestAddress}`)

console.log(await evmosQueryClient.bank.allBalances(evmosTestAddress))
console.log(await evmosQueryClient.bank.allBalances(evmosMainAddress))
console.log(`Transaction Count - Test Account: ${await web3.eth.getTransactionCount(ethTestAddress)}`) // ! gets info from evmos node --> look at RPC url
console.log(`Transaction Count - Main Account: ${await web3.eth.getTransactionCount(ethMainAddress)}`)
