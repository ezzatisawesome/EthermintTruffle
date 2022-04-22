import { evmosToEth } from "@tharsis/address-converter"
import { createTxRawEIP712,
    signatureToWeb3Extension,
    createMessageSend } from "@tharsis/transactions"
import {
  generateEndpointBroadcast,
  generatePostBodyBroadcast,
} from "@tharsis/provider"

const chain = {
  chainId: 9000,
  cosmosChainId: "evmos_9000-4",
}

const sender = {
  accountAddress: "ethm1tfegf50n5xl0hd5cxfzjca3ylsfpg0fned5gqm",
  sequence: 1,
  accountNumber: 9,
  pubkey: "AgTw+4v0daIrxsNSW4FcQ+IoingPseFwHO1DnssyoOqZ",
}

const fee = {
  amount: "20",
  denom: "aevmos",
  gas: "200000",
}

const memo = ""

const params = {
  destinationAddress: "evmos1pmk2r32ssqwps42y3c9d4clqlca403yd9wymgr",
  amount: "1",
  denom: "aevmos",
}

const msg = createMessageSend(chain, sender, fee, memo, params)

console.log(msg)



// Init Metamask
await window.ethereum.enable()

// Request the signature
let signature = await window.ethereum.request({
  method: "eth_signTypedData_v4",
  params: [evmosToEth(sender.accountAddress), JSON.stringify(msg.eipToSign)],
})

// The chain and sender objects are the same as the previous example
let extension = signatureToWeb3Extension(chain, sender, signature)

// Create the txRaw
let rawTx = createTxRawEIP712(
  msg.legacyAmino.body,
  msg.legacyAmino.authInfo,
  extension
)

// Broadcast it
const postOptions = {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: generatePostBodyBroadcast(rawTx),
}

let broadcastPost = await fetch(
  `http://localhost:1317${generateEndpointBroadcast()}`,
  postOptions
)
let response = await broadcastPost.json()
