import { call } from 'redux-saga/effects'

const wrapper = (sagas) => {
  return Object.keys(sagas).reduce((all, key) => {
    const sagaFn = sagas[key]

    function* errorWrappedSaga(action) {
      try {
        yield call(sagaFn, action)
      }
      catch(e) {
        console.error(`[SAGA ERROR] ${e}`)        
      }
    }
    all[key] = errorWrappedSaga
    return all
  }, {})
}

export default wrapper