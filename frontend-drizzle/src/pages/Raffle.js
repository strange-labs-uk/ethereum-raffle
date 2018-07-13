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
import Slider from '@material-ui/lab/Slider';

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
    numTickets: null,
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
    let price = null
    let feePercent = null
    let startTime = null
    let endTime = null
    let complete = null
    let drawPeriod = null
    let minPlayers = null
    if (gameSettingsRef) {
      // const gameSettingsKeys = ['Price', 'Fee (%)', 'Starts', 'Ends', 'Complete', 'Draw Period (s)', 'Minimum Players']
      const date = x => new Date(x*1000).toString()
      const values = gameSettingsRef.value
      state.raffle.gameSettings = gameSettings = [
        { key: 'Current Game', value: currentGameIndex },
        { key: 'Price (wei)', value: values[0] },
        { key: 'Fee (%)', value: values[1] },
        { key: 'Starts', value: date(values[2]) },
        { key: 'Ends', value: date(values[3]) },
        { key: 'Minimum Players', value: values[6] },
      ]
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

  state = {
    numTickets: 1,
  }

  handleSliderChange = (event, numTickets) => {
    this.setState({ numTickets })
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
    
    const { numTickets } = this.state;

    const price = numTickets*(gameSettings[1]?gameSettings[1].value:null)

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
                <Slider value={numTickets} min={1} max={100} step={1} onChange={this.handleSliderChange}/>
                <Button 
                  variant="raised" 
                  color="primary" 
                  disabled={ formValid ? false : true }
                  className={ classes.button }
                  onClick={ () => {
                    raffle.buyTickets(this.drizzle, formValues)
                  } }>
                  Buy {numTickets} tickets for {price} wei!
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