import { QueryClient, setupBankExtension,  } from "@cosmjs/stargate"
import { Tendermint34Client } from "@cosmjs/tendermint-rpc"
import { ethToEvmos, evmosToEth } from "@tharsis/address-converter"
import Web3 from "web3"

const evmosAddress = "evmos1l0f7llfvjmqy5k65x4ycq8vqpmchszw8c84uk7"

// const ethAddress = ethToEvmos(evmosAddress)
// const evmosJsonRpcUrl = "http://localhost:8545"
// const web3 = new Web3(evmosJsonRpcUrl)
// console.log(`Transaction Count - Test Account: ${await web3.eth.getBalance(ethAddress)}`) // ! gets info from evmos node --> look at RPC url

const rpcUrl = "http://0.0.0.0:26657"
const tmClient = await Tendermint34Client.connect(rpcUrl)
const queryClient = QueryClient.withExtensions(tmClient, setupBankExtension)
console.log(await queryClient.bank.allBalances(evmosAddress))