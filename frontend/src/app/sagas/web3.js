import { take, put, call, fork, select, all, takeLatest, takeEvery } from 'redux-saga/effects'

import actions from '../actions'
import selectors from '../selectors'

function getWeb3() {
  return new Promise(function(resolve, reject) {
    window.addEventListener('load', function() {
      var results
      var web3 = window.web3
      var TEST_WEB3_PROVIDER = process.env.TEST_WEB3_PROVIDER
      if(TEST_WEB3_PROVIDER) {
        var provider = new Web3.providers.HttpProvider(TEST_WEB3_PROVIDER)
        web3 = new Web3(provider)
        console.log(`TEST_WEB3_PROVIDER ${TEST_WEB3_PROVIDER} web3 detected.`);
        resolve({web3})
      }
      else if (typeof web3 !== 'undefined') {        
        web3 = new Web3(web3.currentProvider)
        console.log('Injected web3 detected.');
        resolve({web3})
      }      
      else {
        console.log('No web3 instance injected, returning null');
        resolve({})
      }
    })
  })
  return getWeb3
}

function getAccounts() {
  return new Promise(function(resolve, reject) {
    web3.eth.getAccounts(function(err, accounts){
      if (err != null) reject("An error occurred: "+err);
      else if (accounts.length == 0) resolve([])
      else resolve(accounts)
    })
  })
}

const Web3Sagas = (opts = {}) => {

  function* initialize() {
    const web3Result = yield call(getWeb3)

    const web3 = web3Result.web3

    if(!web3) {
      yield put(actions.value.set('web3Error', true))
      return
    }

    const accounts = yield call(getAccounts)
    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.dir(web3)
    console.dir(accounts)
  }

  return {
    initialize,
  }
}

export default Web3Sagas