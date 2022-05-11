import { evmosTestnetOptions } from "./testnetOptions.js";
import Long from "long"
import DotenvConfigOptions  from "dotenv"
import { ethers } from "ethers"
DotenvConfigOptions.config({ path: './app.env'})

const provider = new ethers.providers.JsonRpcProvider(evmosTestnetOptions.jsonRpcUrl)
const balance = await provider.getBalance(process.env.mainEthAddress)

console.log(await provider.getBlockNumber())
console.log(ethers.utils.formatEther(balance))

const hdnode = ethers.Wallet.fromMnemonic(process.env.mainBipMnemonic)
console.log(hdnode.provider)