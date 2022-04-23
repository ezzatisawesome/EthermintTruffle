import axios from  "axios";
import fs from "fs";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice, calculateFee } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet, makeCosmoshubPath } from "@cosmjs/proto-signing";
import { toUtf8, toBase64 } from "@cosmjs/encoding";
import path from "path";

/*
 * This is a set of helpers meant for use with @cosmjs/cli
 * With these you can easily use the cw20 contract without worrying about forming messages and parsing queries.
 *
 * Usage: npx @cosmjs/cli@^0.26 --init https://raw.githubusercontent.com/CosmWasm/cosmwasm-plus/master/contracts/cw20-base/helpers.ts
 *
 * Create a client:
 *   const [addr, client] = await useOptions(pebblenetOptions).setup('password');
 *
 * Get the mnemonic:
 *   await useOptions(pebblenetOptions).recoverMnemonic(password);
 *
 * Create contract:
 *   const contract = CW20(client, pebblenetOptions.fees);
 *
 * Upload contract:
 *   const codeId = await contract.upload(addr);
 *
 * Instantiate contract example:
 *   const initMsg = {
 *     name: "Potato Coin",
 *     symbol: "TATER",
 *     decimals: 2,
 *     initial_balances: [{ address: addr, amount: "10000" }],
 *     mint: { "minter": addr }
 *   };
 *   const instance = await contract.instantiate(addr, codeId, initMsg, 'Potato Coin!');
 *
 * If you want to use this code inside an app, you will need several imports from https://github.com/CosmWasm/cosmjs
*/

export async function generateWallet(){
  return await DirectSecp256k1HdWallet.generate(12, {hdPaths: [pebblenetOptions.hdPath], prefix: pebblenetOptions.bech32prefix})
}
const pebblenetGasPrice = GasPrice.fromString("0.01upebble");
export const pebblenetOptions = {
  httpUrl: 'https://rpc.pebblenet.cosmwasm.com',
  networkId: 'pebblenet-1',
  bech32prefix: 'wasm',
  feeToken: 'upebble',
  faucetUrl: 'https://faucet.pebblenet.cosmwasm.com/credit',
  hdPath: makeCosmoshubPath(0),
  defaultKeyFile: path.join(process.env.HOME, ".pebblenet.key"),
  fees: {
    upload: calculateFee(1500000, pebblenetGasPrice),
    init: calculateFee(500000, pebblenetGasPrice),
    exec: calculateFee(200000, pebblenetGasPrice),
  },
}


export const useOptions = (options) => {

  const connect = async (
    wallet,
    options
  ) => {
    const clientOptions = {
      prefix: options.bech32prefix
    }
    return await SigningCosmWasmClient.connectWithSigner(options.httpUrl, wallet, clientOptions)
  };

  const hitFaucet = async (
    faucetUrl,
    address,
    denom
  ) => {
    await axios.post(faucetUrl, {denom, address});
  }

  const setup = async (wallet) => {
    const client = await connect(wallet, pebblenetOptions);
    const [account] = await wallet.getAccounts();
    // ensure we have some tokens
    if (options.faucetUrl) {
      const tokens = await client.getBalance(account.address, options.feeToken)
      if (tokens.amount === '0') {
        console.log(`Getting ${options.feeToken} from faucet`);
        await hitFaucet(options.faucetUrl, account.address, options.feeToken);
      }
    }
    return client;
  }

  return {setup};
}

export const CW20 = (client, fees) => {
  const use = (contractAddress) => {
    const balance = async (address) => {
      const result = await client.queryContractSmart(contractAddress, {balance: { address }});
      return result.balance;
    };

    const allowance = async (owner, spender) => {
      return client.queryContractSmart(contractAddress, {allowance: { owner, spender }});
    };

    const allAllowances = async (owner, startAfter, limit) => {
      return client.queryContractSmart(contractAddress, {all_allowances: { owner, start_after: startAfter, limit }});
    };

    const allAccounts = async (startAfter, limit) => {
      const accounts= await client.queryContractSmart(contractAddress, {all_accounts: { start_after: startAfter, limit }});
      return accounts.accounts;
    };

    const tokenInfo = async () => {
      return client.queryContractSmart(contractAddress, {token_info: { }});
    };

    const minter = async () => {
      return client.queryContractSmart(contractAddress, {minter: { }});
    };

    // mints tokens, returns transactionHash
    const mint = async (senderAddress, recipient, amount) => {
      const result = await client.execute(senderAddress, contractAddress, {mint: {recipient, amount}}, fees.exec);
      return result.transactionHash;
    }

    // transfers tokens, returns transactionHash
    const transfer = async (senderAddress, recipient, amount) => {
      const result = await client.execute(senderAddress, contractAddress, {transfer: {recipient, amount}}, fees.exec);
      return result.transactionHash;
    }

    // burns tokens, returns transactionHash
    const burn = async (senderAddress, amount) => {
      const result = await client.execute(senderAddress, contractAddress, {burn: {amount}}, fees.exec);
      return result.transactionHash;
    }

    const increaseAllowance = async (senderAddress, spender, amount) => {
      const result = await client.execute(senderAddress, contractAddress, {increase_allowance: {spender, amount}}, fees.exec);
      return result.transactionHash;
    }

    const decreaseAllowance = async (senderAddress, spender, amount) => {
      const result = await client.execute(senderAddress, contractAddress, {decrease_allowance: {spender, amount}}, fees.exec);
      return result.transactionHash;
    }

    const transferFrom = async (senderAddress, owner, recipient, amount) => {
      const result = await client.execute(senderAddress, contractAddress, {transfer_from: {owner, recipient, amount}}, fees.exec);
      return result.transactionHash;
    }

    const jsonToBinary  = (json) => { return toBase64(toUtf8(JSON.stringify(json)))}

    const send = async (senderAddress, recipient, amount, msg) => {
      const result = await client.execute(senderAddress, contractAddress, {send: {recipient, amount, msg: jsonToBinary(msg)}}, fees.exec);
      return result.transactionHash;
    }

    const sendFrom = async (senderAddress, owner, recipient, amount, msg) => {
      const result = await client.execute(senderAddress, contractAddress, {send_from: {owner, recipient, amount, msg: jsonToBinary(msg)}}, fees.exec);
      return result.transactionHash;
    }

    return {
      contractAddress,
      balance,
      allowance,
      allAllowances,
      allAccounts,
      tokenInfo,
      minter,
      mint,
      transfer,
      burn,
      increaseAllowance,
      decreaseAllowance,
      transferFrom,
      send,
      sendFrom
    };
  }

  const downloadWasm = async (url) => {
    const r = await axios.get(url, { responseType: 'arraybuffer' })
    if (r.status !== 200) {
      throw new Error(`Download error: ${r.status}`)
    }
    return r.data
  }

  const upload = async (senderAddress) => {
    const sourceUrl = "https://github.com/CosmWasm/cosmwasm-plus/releases/download/v0.8.1/cw20_base.wasm";
    const wasm = await downloadWasm(sourceUrl);
    const result = await client.upload(senderAddress, wasm, fees.upload);
    return result.codeId;
  }

  const instantiate = async (senderAddress, codeId, initMsg, label, admin) => {
    const result = await client.instantiate(senderAddress, codeId, initMsg, label, fees.init, { memo: `Init ${label}`, admin});
    return use(result.contractAddress);
  }

  return { upload, instantiate, use };
}