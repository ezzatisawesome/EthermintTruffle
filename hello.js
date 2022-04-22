import { ethToEvmos } from "@tharsis/address-converter"
import { generateEndpointAccount } from "@tharsis/provider"
import fetch from "node-fetch"

const sender = "evmos1luef03klz5tshlhcjstkkaa20gquwl0qhkff73"
let ethAddress = "0x3c7f1677649792C1a9819d8cd5f2515B91663CE9"


if (ethAddress.split('0x').length == 2) {
    ethAddress = ethToEvmos(ethAddress)
}
console.log(ethAddress)

/*

By default, a validator node exposes two API endpoints:

http://localhost:26657 (opens new window)for the low-level Tendermint API
http://localhost:1317 (opens new window)for the high-level blockchain API

*/

const options = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
}
let addyRaw = await fetch(
    `http://127.0.0.1:26657${generateEndpointAccount(sender)}`,
    options
)

console.log(addyRaw)