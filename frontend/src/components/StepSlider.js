import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'

import Slider from '@material-ui/lab/Slider'
import InputLabel from '@material-ui/core/InputLabel'
import FormControl from '@material-ui/core/FormControl'
import FormHelperText from '@material-ui/core/FormHelperText'

const styles = theme => ({
  margin: {
    margin: theme.spacing.unit,
  },
})

class StepSlider extends React.Component {
  state = {
    intValue: 1
  }

  render() {
    const {
      input: {onChange, value},
      label,
      type,
      name,
      classes,
      inputProps,
      meta: { touched, error, warning }      
    } = this.props

    const { intValue } = this.state

    console.dir(value)

    return (
      <FormControl
        fullWidth
        className={classes.margin}
        aria-describedby={ name + "-helper" }
        error={ touched && error ? true : false }
      >
        <InputLabel 
          htmlFor={ name }>{ label }</InputLabel>
        <Slider
          id={ name }
          key={ name }
          type={ type }
          min={ 1 }
          max={ 100 }
          step={ 1 }
          value={intValue}
          onChange={(event, value)=>onChange(this.setState({intValue: value}))}
          // error={ touched && error ? true : false }
          {...inputProps}
        />
        {
          touched && error ? (
            <FormHelperText id={ name + "-helper" }>
              { error }
            </FormHelperText>
          ) : null
        }
      </FormControl>
    )
  }
}

export default withStyles(styles)(StepSlider)