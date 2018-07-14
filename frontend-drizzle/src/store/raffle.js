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
  buyTickets: (drizzle, price) => ({
    type: 'BUY_TICKETS',
    drizzle,
    price,
  }),
  requestTickets: (requestTicketKey, price) => ({
    type: 'REQUEST_TICKETS',
    requestTicketKey,
    price,
  }),
}

const mutations = {
  REQUEST_CURRENT_GAME_INDEX: (state, action) => {
    state.currentGameIndexKey = action.key
  },
  REQUEST_GAME_SETTINGS: (state, action) => {
    state.gameSettingsKey = action.key
  },
  REQUEST_TICKETS: (state, action) => {
    state.requestTicketKey = action.requestTicketKey
    state.price = action.price
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
      BUY_TICKETS: function* (action) {
        try {    
          const drizzle = action.drizzle
          const price = action.price
          const requestTicketKey = drizzle.contracts.HashKeyRaffle.methods.play.cacheSend({value: price})
          yield put(actions.requestTickets(requestTicketKey, price))
          yield put(initialize('price', {}))
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