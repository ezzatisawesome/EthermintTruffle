import { GasPrice, calculateFee } from "@cosmjs/stargate";
import { makeCosmoshubPath } from "@cosmjs/proto-signing";
import Crypto from "@cosmjs/crypto"
import path from "path";

const cliffnetGasPrice = GasPrice.fromString("0.01upebble");

export const cliffnetOptions = {
  httpUrl: "https://rpc.cliffnet.cosmwasm.com/",
  networkId: "cliffnet-1",
  bech32prefix: "wasm",
  feeToken: "upebble",
  faucetUrl: "https://faucet.cliffnet.cosmwasm.com",
  lcdUrl: "https://lcd.cliffnet.cosmwasm.com/",
  hdPath: makeCosmoshubPath(0),
  defaultKeyFile: path.join(process.env.HOME, ".pebblenet.key"),
  fees: {
    upload: calculateFee(1500000, cliffnetGasPrice),
    init: calculateFee(500000, cliffnetGasPrice),
    exec: calculateFee(200000, cliffnetGasPrice),
  },
}

export const evmosTestnetOptions = {
  httpUrl: "https://rest.bd.evmos.dev:1317",
  jsonRpcUrl: "https://eth.bd.evmos.dev:8545",
  rpcUrl: "https://tendermint.bd.evmos.dev:26657",
  bech32prefix: "evmos",
  denom: "atevmos",
  chainId: 9000,
  networkId: "evmos_9000-4",
  hdPath: [
    Crypto.Slip10RawIndex.hardened(44),
    Crypto.Slip10RawIndex.hardened(118),
    Crypto.Slip10RawIndex.hardened(0),
    Crypto.Slip10RawIndex.normal(0),
    Crypto.Slip10RawIndex.normal(0),
  ],
}

export const evmosTestnetLocalOptions = {
  httpUrl: "http://0.0.0.0:1317",
  jsonRpcUrl: "http://0.0.0.0:8545",
  rpcUrl: "http://0.0.0.0:26657",
  bech32prefix: "evmos",
  denom: "aevmos",
  chainId: 9000,
  networkId: "evmos_9000-1"
}

export const osmoTestnetOptions = {
  httpUrl: "https://testnet-rest.osmosis.zone",
  rpcUrl: "https://testnet-rpc.osmosis.zone",
  bech32prefix: "osmo",
  denom: "uosmo",
  networkId: "osmosis-test-4"
}

// evmos13glqz7s2pwgs9qudzuz7nujqkv0626jclekwtc