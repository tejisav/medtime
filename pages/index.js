import React from 'react'
import Router from 'next/router'
import Link from 'next/link'
import { Container, Row, Col, Button, Jumbotron, ListGroup, ListGroupItem } from 'reactstrap'
import { NextAuth } from 'next-auth/client'
import Page from '../components/page'
import Layout from '../components/layout'
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
      // if (this.props.session.user.type === "doctor") {
      //   return (
      //     <Layout {...this.props} navmenu={false} container={false}>
      //       <Jumbotron className="text-light rounded-0" style={{
      //         backgroundColor: 'rgba(73,155,234,1)',
      //         background: 'radial-gradient(ellipse at center, rgba(73,155,234,1) 0%, rgba(32,124,229,1) 100%)',
      //         boxShadow: 'inset 0 0 100px rgba(0,0,0,0.1)'
      //         }}>
      //         <Container className="mt-2 mb-2">
      //           <h1 className="display-2 mb-3" style={{fontWeight: 300}}>
      //             <span style={{fontWeight: 600}}>
      //               <span className="mr-3">▲</span>
      //               <br className="v-block d-sm-none"/>
      //               MedTime
      //             </span>
      //             <br className="v-block d-lg-none"/> - Team illusion
      //           </h1>
      //           <p className="lead mb-5">
      //             Doctor Dashboard
      //           </p>
      //           <p className="text-right">
      //             <a href="https://github.com/tejisav/medtime" className="btn btn-outline-light btn-lg"><span className="icon ion-logo-github mr-2"/> GitHub</a>
      //           </p>
      //           <style jsx>{`
      //             .display-2  {
      //               text-shadow: 0 5px 10px rgba(0,0,0,0.3);
      //               color: rgba(255,255,255,0.9);
      //             }
      //             .lead {
      //               font-size: 3em;
      //               opacity: 0.7;
      //             }
      //             @media (max-width: 767px) {
      //               .display-2 {
      //                 font-size: 3em;
      //                 margin-bottom: 1em;
      //               }
      //               .lead {
      //                 font-size: 1.5em;
      //               }
      //             }
      //           `}</style>
      //         </Container>
      //       </Jumbotron>
      //     </Layout>
      //   )
      // } else if (this.props.session.user.type === "patient") {
      //   return (
      //     <Layout {...this.props} navmenu={false} container={false}>
      //       <Jumbotron className="text-light rounded-0" style={{
      //         backgroundColor: 'rgba(73,155,234,1)',
      //         background: 'radial-gradient(ellipse at center, rgba(73,155,234,1) 0%, rgba(32,124,229,1) 100%)',
      //         boxShadow: 'inset 0 0 100px rgba(0,0,0,0.1)'
      //         }}>
      //         <Container className="mt-2 mb-2">
      //           <h1 className="display-2 mb-3" style={{fontWeight: 300}}>
      //             <span style={{fontWeight: 600}}>
      //               <span className="mr-3">▲</span>
      //               <br className="v-block d-sm-none"/>
      //               MedTime
      //             </span>
      //             <br className="v-block d-lg-none"/> - Team illusion
      //           </h1>
      //           <p className="lead mb-5">
      //             Patient Dashboard
      //           </p>
      //           <p className="text-right">
      //             <a href="https://github.com/tejisav/medtime" className="btn btn-outline-light btn-lg"><span className="icon ion-logo-github mr-2"/> GitHub</a>
      //           </p>
      //           <style jsx>{`
      //             .display-2  {
      //               text-shadow: 0 5px 10px rgba(0,0,0,0.3);
      //               color: rgba(255,255,255,0.9);
      //             }
      //             .lead {
      //               font-size: 3em;
      //               opacity: 0.7;
      //             }
      //             @media (max-width: 767px) {
      //               .display-2 {
      //                 font-size: 3em;
      //                 margin-bottom: 1em;
      //               }
      //               .lead {
      //                 font-size: 1.5em;
      //               }
      //             }
      //           `}</style>
      //         </Container>
      //       </Jumbotron>
      //     </Layout>
      //   )
      // } else {
      //   return(<div/>)
      // }
    } else {
      return(<div/>)
    }
  }
}