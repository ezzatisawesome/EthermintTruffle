import { createMessageSend } from '@tharsis/transactions'

const chain = {
    chainId: 9000,
    cosmosChainId: 'evmos_9000-1',
}

const sender = {
    accountAddress: 'ethm1tfegf50n5xl0hd5cxfzjca3ylsfpg0fned5gqm',
    sequence: 1,
    accountNumber: 9,
    pubkey: 'AgTw+4v0daIrxsNSW4FcQ+IoingPseFwHO1DnssyoOqZ',
}

const fee = {
    amount: '20',
    denom: 'aevmos',
    gas: '200000',
}

const memo = ''

const params = {
    destinationAddress: 'evmos1pmk2r32ssqwps42y3c9d4clqlca403yd9wymgr',
    amount: '1',
    denom: 'aevmos',
}

const msg = createMessageSend(chain, sender, fee, memo, params)

console.log(msg)