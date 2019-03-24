import React from 'react'
import Router from 'next/router'
import Link from 'next/link'
import { Container, Row, Col, Button, Jumbotron, ListGroup, ListGroupItem } from 'reactstrap'
import { NextAuth } from 'next-auth/client'
import Page from '../components/page'
import Layout from '../components/layout'
import Unverified from '../components/unverified'
import dynamic from 'next/dynamic'
import ReactChartkick, { LineChart } from 'react-chartkick'
import Chart from 'chart.js'
 
ReactChartkick.addAdapter(Chart)

const CalendarWithNoSSR = dynamic(
  () => import('../components/calendar'),
  {
    ssr: false
  }
)

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

  render() {
    if (this.props.session.user && this.props.session.user.signUpComplete) {
      if (this.props.session.user.type === "patient" || (this.props.session.user.type === "doctor" && this.props.session.user.clinicVerified)) {
        return (
          <Layout {...this.props} navmenu={false} container={false}>
            <Container className="mt-2 mb-2">
              <CalendarWithNoSSR />
              <br />
              <br />
              <Col xs={12} md={6}>
                <LineChart data={{"2019-03-2": 0, "2019-03-3": 15, "2019-03-4": 40, "2019-03-5": 30, "2019-03-6": 50, "2019-03-7": 75, "2019-03-8": 100}} />
              </Col>
            </Container>
          </Layout>
        )
      } else {
        return(<Unverified  {...this.props}/>)
      }
    } else {
      return(<div/>)
    }
  }
}