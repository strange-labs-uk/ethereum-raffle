import { reducer as form } from 'redux-form'
import ValueReducer from 'template-ui/lib/plugins/value/reducer'

import * as actions from './actions'
import config from './config'

const value = ValueReducer(config.initialState.value)

const reducers = {
  value,
  form
}


export default reducers
