import React from 'react'
import PropTypes from 'prop-types'
import { connectStore } from 'redux-box'
import { connect } from 'react-redux'
import { withStyles } from '@material-ui/core/styles'
import { reduxForm, Field, getFormSyncErrors, isValid } from 'redux-form'

import Paper from '@material-ui/core/Paper'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import Link from 'redux-first-router-link'
import Button from '@material-ui/core/Button'
import Divider from '@material-ui/core/Divider'
import FormControl from '@material-ui/core/FormControl'

import validators from '../utils/validators'
import TextField from '../components/TextField'

import storageModule from '../store/storage'

const styles = theme => ({
  root: {
    padding: theme.spacing.unit * 2,
  },
  paper: {
    padding: theme.spacing.unit * 2,
    textAlign: 'left',
    color: theme.palette.text.secondary,
  },
  textLink: {
    marginTop: theme.spacing.unit * 3,
  },
  formControl: {
    width: "95%"
  },
  button: {
    marginTop: '20px'
  },
  marginDivider: {
    marginTop: '10px',
    marginBottom: '10px',
  }
})

@reduxForm({
  form: 'storage',
  initialValues: {
    key: '',
    value:'',
  }
})
@connectStore({
  storage: storageModule,
})
@connect(
  (state, ownProps) => {
    const formValues = state.form.storage.values
    const formErrors = getFormSyncErrors('storage')(state)
    const formValid = isValid('storage')(state)

    const account = state.accounts[0]
    
    let currentKey = ""
    let currentValue = ""

    // get the key used to represent the call to the "getValue"
    // function of the contract - we use this to get at the actual value below
    const readValuesRequestKey = state.storage.currentValueRequestKey

    // get the actual reference to the request itself via drizzle
    const readValuesRequestRef = state.contracts.KeyValue.getValue[readValuesRequestKey]

    // oh look - we have a result back from the contract
    if(readValuesRequestRef) {
      currentKey = readValuesRequestRef.value[0]
      currentValue = readValuesRequestRef.value[1]
    }

    return {
      formValues,
      formErrors,
      formValid,
      currentKey,
      currentValue,
      account,
    }
  },
  (dispatch) => {
    return {
      
    }
  }
)
class Storage extends React.Component {

  /*
  
    we have to pass the drizzle instance into actions that need it
    it is passed down as childContext from the DrizzleProvider
    
  */
  static contextTypes = {
    drizzle: PropTypes.object
  }

  constructor (props, context) {
    super(props)
    this.drizzle = context.drizzle
  }

  /*
  
    we trigger a loadCurrentValues action when the page loads
    drizzle will keep this in sync with the current value so
    we only need to do this once
    
  */
  componentDidMount() {
    const { storage } = this.props
    storage.loadCurrentValues(this.drizzle)
  }

  render() {
    const { 
      classes,
      formValues,
      formErrors,
      formValid,
      storage,
      currentKey,
      currentValue,
      account,
    } = this.props

    return (
      <div className={classes.root}>
        <Grid container spacing={24}>
          <Grid item xs={12} sm={6}>
            <Paper className={classes.paper}>
              <Typography variant="body2">
                Set Key / Value
              </Typography>
              <Typography variant="body2">
                <b>Account: </b> { account }
              </Typography>
              <FormControl component="fieldset" className={ classes.formControl }>
                <Field
                  name="key"
                  label="Key"
                  component={ TextField }
                  validate={ validators.required }
                />
                <Field
                  name="value"
                  label="Value"
                  component={ TextField }
                  validate={ validators.required }
                />
                <Button 
                  variant="raised" 
                  color="primary" 
                  disabled={ formValid ? false : true }
                  className={ classes.button }
                  onClick={ () => {
                    storage.writeCurrentValues(this.drizzle, formValues)
                  } }>
                  Save Value!
                </Button>
              </FormControl>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper className={classes.paper}>
              <Typography variant="body2">
                Current Key / Value
              </Typography>
              <Divider className={ classes.marginDivider } />
              <Typography variant="body2">
                <b>Key: </b> { currentKey }
              </Typography>
              <Divider className={ classes.marginDivider } />
              <Typography variant="body2">
                <b>Value: </b> { currentValue }
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </div>
    )
  }
}

Storage.propTypes = {
  classes: PropTypes.object.isRequired,
}

export default withStyles(styles)(Storage)