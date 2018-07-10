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
  marginTop: {
    marginTop: theme.spacing.unit * 2,
  }
})

@connect(
  (state, ownProps) => {
    return {
      drizzleStatus: state.drizzleStatus,
      web3: state.web3,
      accounts: state.accounts,
    }
  },
  (dispatch) => {
    return {
      
    }
  }
)
class Web3Wrapper extends React.Component {

  getPaper(content) {
    const { classes } = this.props
    return (
      <div className={classes.root}>
        <Grid container spacing={24}>
          <Grid item xs={12} sm={6}>
            <Paper className={classes.paper}>
              { content }
            </Paper>
          </Grid>
        </Grid>
      </div>
    )
  }

  getLoading() {
    const { classes } = this.props
    const content = (
      <div>
        <Typography variant="display1">
          ⚙️ Loading...
        </Typography>
        <Typography variant="body2" className={ classes.marginTop }>
          The application is loading...
        </Typography>
      </div>
    )
    return this.getPaper(content)
  }

  getNotConnected() {
    const { classes } = this.props
    const content = (
      <div>
        <Typography variant="display1">
          Not Connected...
        </Typography>
        <Typography variant="body2" className={ classes.marginTop }>
          You need to install metamask and to use this app...
        </Typography>
      </div>
    )
    return this.getPaper(content)
  }

  getNoAccount() {
    const { classes } = this.props
    const content = (
      <div>
        <Typography variant="display1">
          No Accounts detected...
        </Typography>
        <Typography variant="body2" className={ classes.marginTop }>
          You need to login to metamask to use this app...
        </Typography>
      </div>
    )
    return this.getPaper(content)
  }

  render() {
    const { classes, drizzleStatus, web3, accounts } = this.props

    const accountCount = Object.keys(accounts).length

    if (this.props.web3.status === 'failed') return this.getNotConnected()
    if (this.props.web3.status === 'initializing') return this.getLoading()
    if (!this.props.drizzleStatus.initialized) return this.getLoading()
    if (accountCount <= 0) return this.getNoAccount()
    if (this.props.drizzleStatus.initialized) return this.props.children

    return this.getLoading()
  }
}

Web3Wrapper.propTypes = {
  classes: PropTypes.object.isRequired,
}

export default withStyles(styles)(Web3Wrapper)