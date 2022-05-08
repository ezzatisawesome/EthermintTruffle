import { generateEndpointAccount } from "@tharsis/provider"
import fetch from "node-fetch"

const sender = "evmos1u7hehg2wr00xzpvaupthwky8e3lxxmjxdeeqwj"

const options = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
}

let accountDataRaw = await fetch(`https://rest.bd.evmos.dev:1317${generateEndpointAccount(sender)}`, options)
let accountData = await accountDataRaw.json()
console.log(accountData.account.base_account.pub_key.key)
