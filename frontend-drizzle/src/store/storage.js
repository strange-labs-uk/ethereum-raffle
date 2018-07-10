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
  currentValueRequestKey: null,
  writeValueStackId: null,
}

const actions = {
  loadCurrentValues: (drizzle) => ({
    type: 'LOAD_CURRENT_VALUES',
    drizzle,
  }),
  setLoadCurrentValuesRequestKey: (key) => ({
    type: 'SET_LOAD_CURRENT_VALUES_REQUEST_KEY',
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
  SET_LOAD_CURRENT_VALUES_REQUEST_KEY: (state, action) => {
    state.currentValueRequestKey = action.key
  },
  SET_WRITE_CURRENT_VALUES_REQUEST_KEY: (state, action) => {
    state.writeValueStackId = action.stackId
  },
}

const sagas = createSagas(
  sagaErrorWrapper(
    {
      LOAD_CURRENT_VALUES: function* (action) {
        try {
          const drizzle = action.drizzle
          const dataKey = drizzle.contracts.KeyValue.methods.getValue.cacheCall()
          yield put(actions.setLoadCurrentValuesRequestKey(dataKey))
          yield put(snackbar.actions.setMessage('Success reading value from storage'))
        }
        catch(err){
          yield put(snackbar.actions.setError(err))
        }
      },
      WRITE_CURRENT_VALUES: function* (action) {
        try {    
          const drizzle = action.drizzle
          const values = action.values
          const stackId = drizzle.contracts.KeyValue.methods.setValue.cacheSend(values.key, values.value)
          yield put(actions.setWriteCurrentValuesRequestStackId(stackId))
          yield put(initialize('value', {}))    
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
  name : 'storage',
  state, 
  actions, 
  mutations,
  sagas,
}

export default module