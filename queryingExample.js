import { generateEndpointAccount } from "@tharsis/provider"
import fetch from "node-fetch"

const sender = "evmos1zg38a6k0zrcnzgwf7rjjsetcc8f8zs66fvssj3"

const options = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
}

let rawAccountData = await fetch(`http://localhost:1317${generateEndpointAccount(sender)}`, options)

console.log(rawAccountData)
