import KeyValue from '../../build/contracts/KeyValue.json'
import HashKeyRaffle from '../../build/contracts/HashKeyRaffle.json'

const drizzleOptions = {
  web3: {
    block: false,
    fallback: {
      type: 'ws',
      url: 'ws://127.0.0.1:8545'
    }
  },
  contracts: [
    KeyValue,
    HashKeyRaffle,
  ],
  events: {
    KeyValue: ['ValueUpdated']
  },
  polls: {
    accounts: 1500,
    blocks: 1500,
  }
}

export default drizzleOptions