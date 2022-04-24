import { GasPrice, calculateFee } from "@cosmjs/stargate";
import { makeCosmoshubPath } from "@cosmjs/proto-signing";
import path from "path";

const pebblenetGasPrice = GasPrice.fromString("0.01upebble");
export const pebblenetOptions = {
  httpUrl: 'https://rpc.cliffnet.cosmwasm.com/',
  networkId: 'cliffnet-1',
  bech32prefix: 'wasm',
  feeToken: 'upebble',
  faucetUrl: 'https://faucet.cliffnet.cosmwasm.com',
  hdPath: makeCosmoshubPath(0),
  defaultKeyFile: path.join(process.env.HOME, ".pebblenet.key"),
  fees: {
    upload: calculateFee(1500000, pebblenetGasPrice),
    init: calculateFee(500000, pebblenetGasPrice),
    exec: calculateFee(200000, pebblenetGasPrice),
  },
}