import { cliffnetOptions, evmosTestnetOptions, osmoTestnetOptions } from "./testnetOptions.js"

import fetch from "node-fetch"
import Long from "long"
import util from "util"
import DotenvConfigOptions  from "dotenv"
import { ethers } from "ethers"
import { ethToEvmos, evmosToEth } from "@tharsis/address-converter"
import { generateEndpointBroadcast, generatePostBodyBroadcast, generateEndpointAccount } from '@tharsis/provider'
import { createTxRawEIP712, signatureToWeb3Extension, createMessageSend, createTxIBCMsgTransfer } from '@tharsis/transactions'
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { QueryClient, setupBankExtension, setupIbcExtension,  } from "@cosmjs/stargate"
import { Tendermint34Client } from "@cosmjs/tendermint-rpc"
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing"
import { signTypedData, SignTypedDataVersion } from "@metamask/eth-sig-util"

class baoWallet {
    constructor() {
        
    }
}