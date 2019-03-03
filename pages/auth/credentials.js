import React from 'react'
import Router from 'next/router'
import Link from 'next/link'
import { Row, Col } from 'reactstrap'
import Cookies from 'universal-cookie'
import { NextAuth } from 'next-auth/client'
import Page from '../../components/page'
import Layout from '../../components/layout'
import SignInCredentials from '../../components/signin-credentials.js'

export default class extends Page {
  
  static async getInitialProps({req, res, query}) {
    let props = await super.getInitialProps({req})
    props.session = await NextAuth.init({force: true, req: req})
    
    // If signed in already, redirect to account management page.
    if (props.session.user) {
      if (req) {
        res.redirect('/dashboard')
      } else {
        Router.push('/dashboard')
      }
    }

    // If passed a redirect parameter, save it as a cookie
    if (query.redirect) {
      const cookies = new Cookies((req && req.headers.cookie) ? req.headers.cookie : null)
      cookies.set('redirect_url', query.redirect, { path: '/' })
    }
    
    return props
  }
  
  render() {
    if (this.props.session.user) {
      return (
        <Layout {...this.props} navmenu={false}>
          <p className="lead text-center mt-5 mb-5">
            <Link href="/auth"><a>Manage your profile</a></Link>
          </p>
        </Layout>
      )
    } else {
      return (
        <Layout {...this.props} navmenu={false} signinBtn={false}>
          <h1 className="text-center display-4 mt-5">Sign in</h1>
          <Row className="mb-5">
            <Col lg="8" className="mr-auto ml-auto" style={{marginBottom: 20}}>
              <SignInCredentials session={this.props.session}/>
            </Col>
          </Row>
        </Layout>
      )
    }
  }
}