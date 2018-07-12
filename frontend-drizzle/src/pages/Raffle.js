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
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'

import validators from '../utils/validators'
import TextField from '../components/TextField'

import raffleModule from '../store/raffle'

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
  form: 'raffle',
  initialValues: {
    currentGameIndex: null,
  }
})
@connectStore({
  raffle: raffleModule,
})
@connect(
  (state, ownProps) => {
    const formValues = state.form.raffle.values
    const formErrors = getFormSyncErrors('raffle')(state)
    const formValid = isValid('raffle')(state)

    const account = state.accounts[0]
    
    const currentGameIndexRef = state.contracts.HashKeyRaffle.currentGameIndex[state.raffle.currentGameIndexKey]
    let currentGameIndex = null
    if (currentGameIndexRef) {
      state.raffle.currentGameIndex = currentGameIndex = currentGameIndexRef.value
    }

    const gameSettingsRef = state.contracts.HashKeyRaffle.getGameSettings[state.raffle.gameSettingsKey]
    let gameSettings = []
    if (gameSettingsRef) {
      const gameSettingsKeys = ['Price', 'Fee (%)', 'Starts', 'Ends', 'Complete', 'Draw Period (s)', 'Minimum Players']
      const same = x => x
      const date = x => new Date(x*1000).toString()

      const gameSettingsTransform = [same, same, date, date, same, same, same]
      state.raffle.gameSettings = gameSettings = gameSettingsKeys.map((k, i) => ({key: k, value: gameSettingsTransform[i](gameSettingsRef.value[i])}))
    }

    return {
      formValues,
      formErrors,
      formValid,
      currentGameIndex,
      gameSettings,
      account,
    }
  },
  (dispatch) => {
    return {
      
    }
  }
)
class Raffle extends React.Component {

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
    const { raffle } = this.props
    raffle.loadCurrentGameIndex(this.drizzle)
  }

  componentDidUpdate(prevProps) {
    const { raffle, currentGameIndex } = this.props
    if (currentGameIndex !== prevProps.currentGameIndex) {
      raffle.loadGameSettings(this.drizzle, currentGameIndex)
    }
  }

  render() {
    const {
      classes,
      formValues,
      formErrors,
      formValid,
      raffle,
      currentGameIndex,
      gameSettings,
      account,
    } = this.props

    console.dir(gameSettings)    
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
                  name="currentGameIndex"
                  label="currentGameIndex"
                  component={ TextField }
                  validate={ validators.required }
                />
                <Button 
                  variant="raised" 
                  color="primary" 
                  disabled={ formValid ? false : true }
                  className={ classes.button }
                  onClick={ () => {
                    raffle.writeCurrentValues(this.drizzle, formValues)
                  } }>
                  Save Value!
                </Button>
              </FormControl>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper className={classes.paper}>
              <Typography variant="body2">
                Current Game Settings
              </Typography>
              <Divider className={ classes.marginDivider } />
              <Table className={classes.table}>
                <TableBody>
                  <TableRow>
                    <TableCell>Game #</TableCell>  
                    <TableCell numeric>{currentGameIndex}</TableCell>  
                  </TableRow>
                  {gameSettings.map((item, index) => {
                    return (
                      <TableRow key={index}>
                        <TableCell>{item.key}</TableCell>
                        <TableCell numeric>{item.value}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>
      </div>
    )
  }
}

Raffle.propTypes = {
  classes: PropTypes.object.isRequired,
}

export default withStyles(styles)(Raffle)