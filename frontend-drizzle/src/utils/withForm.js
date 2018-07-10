import { connect } from 'react-redux'
import { touch } from 'redux-form'

const ConnectForm = () => {
  return connect(
    state => ({
      
    }),
    dispatch => ({
      formTouch: (form, fields) => dispatch(touch(form, fields)),
    })
  )
}

export default ConnectForm