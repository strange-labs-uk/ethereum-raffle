const fs = require('fs')
const path = require('path')
const Web3 = require('web3')

const abiPath = process.env.ABI_PATH || path.join(__dirname, '..', 'build', 'contracts', 'HashKeyRaffle.json')
const serverAddress = process.env.SERVER_ADDRESS || 'http://127.0.0.1:9545'
const networkId = process.env.NETWORK_ID || '4447'

const abiContentString = fs.readFileSync(abiPath, 'utf8')
const abiObject = JSON.parse(abiContentString)

const contractAddress = abiObject.networks[networkId]

const errorHandler = (msg) => {
  console.error(`[ERROR]: ${msg}`)
  process.exit(1)
}

if(!contractAddress) errorHandler(`No contract found at network: ${networkId}`)
  
const web3 = new Web3(new Web3.providers.HttpProvider(serverAddress))
web3.eth.defaultAccount = web3.eth.accounts[0]

const contract = new web3.eth.contract(abiObject, contractAddress)

contract.currentGameIndex.call({}, (err, result) => {
  if(err) return errorHandler(err)
  console.log(result)
})
