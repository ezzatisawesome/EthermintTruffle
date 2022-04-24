import { GasPrice, calculateFee } from "@cosmjs/stargate";
import { makeCosmoshubPath } from "@cosmjs/proto-signing";
import path from "path";

const cliffnetGasPrice = GasPrice.fromString("0.01upebble");
export const cliffnetOptions = {
  httpUrl: 'https://rpc.cliffnet.cosmwasm.com/',
  networkId: 'cliffnet-1',
  bech32prefix: 'wasm',
  feeToken: 'upebble',
  faucetUrl: 'https://faucet.cliffnet.cosmwasm.com',
  lcdUrl: 'https://lcd.cliffnet.cosmwasm.com/',
  hdPath: makeCosmoshubPath(0),
  defaultKeyFile: path.join(process.env.HOME, ".pebblenet.key"),
  fees: {
    upload: calculateFee(1500000, cliffnetGasPrice),
    init: calculateFee(500000, cliffnetGasPrice),
    exec: calculateFee(200000, cliffnetGasPrice),
  },
}