import { createSagas } from 'redux-box'

const state = {
  message: '',
  isOpen: false,
}

const actions = {
  setMessage: (message) => ({
    type: 'SNACKBAR_MESSAGE',
    message,
  }),
  setError: (message) => ({
    type: 'SNACKBAR_MESSAGE',
    message,
    error: true,
  }),
  close: () => ({
    type: 'SNACKBAR_CLOSE',
  })
}

const getError = (data) => {
  if(!data) {
    return 'no error found'
    return
  }
  if(typeof(data) == 'string') return data
  if(data.response && data.response.data) {
    const body = data.response.data
    return  (body.error || body).toString()
  }
  else {
    return  (data.error || data).toString()  
  }
}

const mutations = {
  SNACKBAR_MESSAGE: (state, action) => {
    state.isOpen = true
    state.message = getError(action.message)
    if(action.error) {
      console.error(`[ERROR] ${state.message}`)
    }
  },
  SNACKBAR_CLOSE: (state, action) => {
    state.isOpen = false
  },
}

const sagas = createSagas({
  HELLO_WORLD: function* () {
    console.log('-------------------------------------------');
    console.log('hello')
  }
})

const module = {
  name : 'error',
  state, 
  actions, 
  mutations,
  sagas,
}

export default module