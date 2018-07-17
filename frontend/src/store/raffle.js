import { createSagas } from 'redux-box'
import { call, put, select } from 'redux-saga/effects'
import sagaErrorWrapper from '../utils/sagaErrorWrapper'

import {
  getFormValues,
  initialize,
} from 'redux-form'
import routerUtils from '../utils/routerUtils'

import snackbar from './snackbar'

import selectors from '../selectors'

const state = {
  currentGameIndex: null,
  currentGameIndexKey: null,
  gameSettings: null,
  gameSettingsKey: null,
  balances: null,
  balancesKey: null,
  ticketsPurchased: null,
  ticketsPurchasedStackId: null,
}

const actions = {
  loadCurrentGameIndex: (drizzle) => ({
    type: 'LOAD_CURRENT_GAME_INDEX',
    drizzle,
  }),
  requestCurrentGameIndex: (key) => ({
    type: 'REQUEST_CURRENT_GAME_INDEX',
    key,
  }),
  loadGameSettings: (drizzle, gameIndex) => ({
    type: 'LOAD_GAME_SETTINGS',
    drizzle,
    gameIndex,
  }),
  requestGameSettings: (key) => ({
    type: 'REQUEST_GAME_SETTINGS',
    key,
  }),
  loadBalances: (drizzle, gameIndex) => ({
    type: 'LOAD_BALANCES',
    drizzle,
    gameIndex,
  }),
  requestBalances: (key) => ({
    type: 'REQUEST_BALANCES',
    key,
  }),
  buyTickets: (drizzle, account, price) => ({
    type: 'BUY_TICKETS',
    account,
    drizzle,
    price,
  }),
  requestTickets: (id) => ({
    type: 'REQUEST_TICKETS',
    id,
  }),
}

const mutations = {
  REQUEST_CURRENT_GAME_INDEX: (state, action) => {
    state.currentGameIndexKey = action.key
  },
  REQUEST_GAME_SETTINGS: (state, action) => {
    state.gameSettingsKey = action.key
  },
  REQUEST_BALANCES: (state, action) => {
    state.balancesKey = action.key
  },
  REQUEST_TICKETS: (state, action) => {
    state.ticketsPurchasedStackId = action.id
  },  
}

const sagas = createSagas(
  sagaErrorWrapper(
    {
      LOAD_CURRENT_GAME_INDEX: function* (action) {
        try {
          const requestKey = action.drizzle.contracts.HashKeyRaffle.methods.currentGameIndex.cacheCall()
          yield put(actions.requestCurrentGameIndex(requestKey))
          yield put(snackbar.actions.setMessage('Reading currentGameIndex from contract'))
        }
        catch(err){
          yield put(snackbar.actions.setError(err))
        }
      },
      LOAD_GAME_SETTINGS: function* (action) {
        try {
          const requestKey = action.drizzle.contracts.HashKeyRaffle.methods.getGameSettings.cacheCall(action.gameIndex)
          yield put(actions.requestGameSettings(requestKey))
          yield put(snackbar.actions.setMessage('Reading gameSettings from contract'))
        }
        catch(err){
          yield put(snackbar.actions.setError(err))
        }
      },
      LOAD_BALANCES: function* (action) {
        try {
          const requestKey = action.drizzle.contracts.HashKeyRaffle.methods.getBalances.cacheCall(action.gameIndex)
          yield put(actions.requestBalances(requestKey))
          yield put(snackbar.actions.setMessage('Reading balances from contract'))
        }
        catch(err){
          yield put(snackbar.actions.setError(err))
        }
      },
      BUY_TICKETS: function* (action) {
        try {    
          const stackId = action.drizzle.contracts.HashKeyRaffle.methods.play.cacheSend({from: action.account, value: action.price})
          yield put(actions.requestTickets(stackId))
          yield put(initialize('numTickets', {}))
          yield put(snackbar.actions.setMessage('Complete transaction on MetaMask'))
        }
        catch(err){
          yield put(snackbar.actions.setError(err))
        }
      },
      DRIZZLE_FAILED: function* (action) {
        yield put(snackbar.actions.setError("Drizzle failure, check console"))
      },
    }
  )
)

const module = {
  name : 'raffle',
  state, 
  actions, 
  mutations,
  sagas,
}

export default module