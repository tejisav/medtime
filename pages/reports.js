import React from 'react'
import fetch from 'isomorphic-fetch'
import { Row, Col, Form, FormGroup, Label, Input, Button } from 'reactstrap'
import { NextAuth } from 'next-auth/client'
import Page from '../components/page'
import Layout from '../components/layout'
import Cookies from 'universal-cookie'

export default class extends Page {

  static async getInitialProps({req}) {
    let props = await super.getInitialProps({req})
    return props
  }

  constructor(props) {
    super(props)
    this.state = {
      alertText: null,
      alertStyle: null,
    }
  }

  render() {
    if (this.props.session.user && this.props.session.user.signUpComplete && this.props.session.user.type !== "clinic") {
      return (
        <Layout {...this.props} title="Reports - Medtime" navmenu={false} container={true}>
          <Row className="mb-1">
            <Col xs="12">
              <div className="card text-center">
                <div className="card-body">
                  <img class="card-img-top" src="/static/image/report-1.jpg" alt="Card image cap" />
                </div>
                <div className="card-footer text-muted">
                  Friday, March 15, 2019
                </div>
              </div>
            </Col>
          </Row><Row className="mb-1">
            <Col xs="12">
              <div className="card text-center">
                <div className="card-body">
                  <img class="card-img-top" src="/static/image/report-2.jpg" alt="Card image cap" />
                </div>
                <div className="card-footer text-muted">
                  Friday, March 15, 2019
                </div>
              </div>
            </Col>
          </Row>
        </Layout>
      )
    }
  }
}