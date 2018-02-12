import React, { Component, PropTypes } from 'react'
import { Grid, Row, Col } from 'react-flexbox-grid'

class Home extends Component {
  render() {
    return (
      <Grid fluid>
        <Row>
          <Col xs={6} md={3}>
            Welcome 
          </Col>
        </Row>
      </Grid>
    )
  }
}

export default Home