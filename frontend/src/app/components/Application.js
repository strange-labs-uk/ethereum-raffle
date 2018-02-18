import React, { Component, PropTypes } from 'react'

import ApplicationLayout from 'template-ui/lib/components/layout2/ApplicationLayout'
import IconText from 'template-ui/lib/components/IconText'
import ListMenu from 'template-ui/lib/components/ListMenu'
import IconMenu from 'template-ui/lib/components/IconMenu'

import horizontal from 'template-ui/lib/components/theme/horizontal.css'
import apptheme from './theme/application.css'

class ApplicationComponent extends Component {
  render() {
    const mainMenu = (
      <ListMenu
        options={ this.props.menuOptions }
        onClick={ this.props.onMenuClick }
      />
    )

    const appbarMenu = (
      <div className={ horizontal.center }>
        <IconMenu
          options={ this.props.menuOptions }
          onClick={ this.props.onOptionClick }
        />
      </div>
    )

    const applicationProps = {
      ...this.props,
      menu: mainMenu,
      appbar: appbarMenu
    }

    return (
      <ApplicationLayout {...applicationProps} />
    )
  }
}

export default ApplicationComponent
