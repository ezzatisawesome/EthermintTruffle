import ethjs from 'ethereumjs-wallet'
const { hdkey } = ethjs
import bip39 from 'bip39'
import { ethToEvmos } from "@tharsis/address-converter"

import DotenvConfigOptions  from "dotenv"
import Web3 from 'web3'
DotenvConfigOptions.config({ path: './app.env'})


const seed = await bip39.mnemonicToSeed(process.env.mainBipMnemonic)
const masterKey = hdkey.fromMasterSeed(seed)
const rootKeys = masterKey.derivePath(`m/44'/60'/0'/0/0`)
const wallet = rootKeys.getWallet()

const ethAddress = `0x${wallet.getAddress().toString('hex')}`

console.log(ethAddress)
console.log(ethToEvmos(ethAddress))

const goerliWeb3 = new Web3("https://goerli.prylabs.net")

/*

! was wayyy more basic than i thought --> it's the names and titles that throw me off
? use ethers.js --> seems way more simple and effective (has bip32 included)

*/