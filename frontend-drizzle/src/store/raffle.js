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
  currentGameIndexRequestKey: null,
  writeValueStackId: null,
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
  writeCurrentValues: (drizzle, values) => ({
    type: 'WRITE_CURRENT_VALUES',
    drizzle,
    values,
  }),
  setWriteCurrentValuesRequestStackId: (stackId) => ({
    type: 'SET_WRITE_CURRENT_VALUES_STACK_ID',
    stackId,
  }),
}

const mutations = {
  REQUEST_CURRENT_GAME_INDEX: (state, action) => {
    state.currentGameIndexRequestKey = action.key
    console.dir(action.key)
  },
}

const sagas = createSagas(
  sagaErrorWrapper(
    {
      LOAD_CURRENT_GAME_INDEX: function* (action) {
        try {
          const drizzle = action.drizzle
          const requestKey = drizzle.contracts.HashKeyRaffle.methods.currentGameIndex.cacheCall()
          yield put(actions.requestCurrentGameIndex(requestKey))
          yield put(snackbar.actions.setMessage('Success reading currentGameIndex from contract'))
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