import React from 'react'
import fetch from 'isomorphic-fetch'
import { Row, Col, Form, FormGroup, Label, Input, Button } from 'reactstrap'
import { NextAuth } from 'next-auth/client'
import Loader from '../components/loader'
import Page from '../components/page'
import Layout from '../components/layout'
import Unverified from '../components/unverified'
import SelectUser from '../components/select-user'

export default class extends Page {

  static async getInitialProps({req, res}) {
    let props = await super.getInitialProps({req})
    props.session = await NextAuth.init({force: true, req: req})
    
    // If not signed in already, redirect to sign in page.
    if (!props.session.user) {
      if (req) {
        res.redirect('/auth')
      } else {
        Router.push('/auth')
      }
    }

    if (props.session.user) {
      if (!props.session.user.signUpComplete) {
        if (req) {
          res.redirect('/signup')
        } else {
          Router.push('/signup')
        }
      }
      
      if (props.session.user.admin) {
        if (req) {
          res.redirect('/admin')
        } else {
          Router.push('/admin')
        }
      }
    }
    
    return props
  }

  constructor(props) {
    super(props)
    this.state = {
      reports: [],
      updating: true
    }
  }

  async componentDidMount() {
    this.updateData()
  }

  updateData() {
    fetch('/account/reports', {
      credentials: 'include'
    })
    .then(res => res.json())
    .then(response => {
      if (response)  {
        this.setState({
          reports: response
        })
      }
      this.setState({
        updating: false
      })
    })
  }

  render() {
    if (this.props.session.user && this.props.session.user.signUpComplete) {
      if (this.props.session.user.type === "patient" || (this.props.session.user.type === "doctor" && this.props.session.user.clinicVerified)) {
        if (this.props.session.user.selectedUser) {
          return (
            <Layout {...this.props} title="Reports - Medtime" navmenu={false} container={true}>
              <Row className="mb-1 text-center">
                <Col xs="12">
                  <UploadReports {...this.props}/>
                </Col>
              </Row>
              <PatientReports reports={this.state.reports} updating={this.state.updating} />
            </Layout>
          )
        } else {
          return(<SelectUser {...this.props}/>)
        }
      } else {
        return(<Unverified {...this.props}/>)
      }
    } else {
      return(<div/>)
    }
  }
}

export class UploadReports extends React.Component {

  constructor(props) {
    super(props)
  }

  render() {
    if (this.props.session.user.type === "doctor" && this.props.session.user.clinicVerified && this.props.session.user.selectedUser) {
      return (
        <Form className="justify-content-center" inline action="/account/upload" method="POST" encType="multipart/form-data">
          {/* <FormGroup>
            <Input type="hidden" name="_csrf" value={this.props.session.csrfToken} />
          </FormGroup> */}
          <FormGroup>
            <Input type="file" name="report" accept="image/*" />
          </FormGroup>
          <Button type="submit" color="primary">Upload</Button>
        </Form>
      )
    } else {
      return (<div/>)
    }
  }
}

export class PatientReports extends React.Component {

  constructor(props) {
    super(props)
  }

  render() {
    if (this.props.updating) {
      return (
        <Loader />
      )
    } else if (this.props.reports.length > 0) {
      return (
        <React.Fragment>
          {
          this.props.reports.map((report) => {
            return (
              <Row className="mb-1">
                <Col xs="12">
                  <div className="card text-center">
                    <div className="card-body">
                      <img className="card-img-top" src={'/image/' + report._id.toString()} alt="report" />
                    </div>
                    <div className="card-footer text-muted">
                      {report.dateAdded}
                    </div>
                  </div>
                </Col>
              </Row>
            )
          })
        }
      </React.Fragment>
      )
    } else {
      return (
        <div className="text-center mt-5 mb-5">
          <p className="lead">No reports uploaded yet!</p>
        </div>
      )
    }
  }
}