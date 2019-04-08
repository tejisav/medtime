import React from 'react'
import Router from 'next/router'
import Link from 'next/link'
import SideNav, { Toggle, Nav, NavItem, NavIcon, NavText } from '@trendmicro/react-sidenav';
import { NextAuth } from 'next-auth/client'
import Cookies from 'universal-cookie'

export default class extends React.Component {
  
  render () {
    return (
      <SideNav>
        <SideNav.Toggle />
        <SideNav.Nav defaultSelected="tracking">
          <UserMenu session={this.props.session} toggleModal={this.props.toggleModal} signinBtn={this.props.signinBtn}/>
        </SideNav.Nav>
      </SideNav>
    )
  }
}

export class UserMenu extends React.Component {
  constructor(props) {
    super(props)
    this.handleSignoutSubmit = this.handleSignoutSubmit.bind(this)
  }

   async handleSignoutSubmit(event) {
     // Save current URL so user is redirected back here after signing out
     const cookies = new Cookies()
     cookies.set('redirect_url', window.location.pathname, { path: '/dashboard' })

     await NextAuth.signout()
     Router.push('/dashboard')
   }
   
  render() {
    if (this.props.session && this.props.session.user) {
      // If signed in display user dropdown menu
      const session = this.props.session
      return (
        <React.Fragment>
          <AdminMenuItem {...this.props}/>
          <UserMenuItem {...this.props}/>
          <Link prefetch href="/account">
            <NavItem eventKey="profile">
              <NavIcon>
                  <i className="icon ion-ios-contact" style={{ fontSize: '1.75em' }} />
              </NavIcon>
              <NavText>
                {session.user.name || session.user.email}
              </NavText>
            </NavItem>
          </Link>
          <NavItem eventKey="signOut" onClick={this.handleSignoutSubmit}>
            <NavIcon>
                <i className="icon ion-md-log-out" style={{ fontSize: '1.75em' }} />
            </NavIcon>
            <NavText>
              Sign Out
            </NavText>
          </NavItem>
        </React.Fragment>
      )
     } if (this.props.signinBtn === false) {
       // If not signed in, don't display sign in button if disabled
      return null
    } else {
      // If not signed in, display sign in button
      return (
        <NavItem eventKey="signIn" onClick={this.props.toggleModal}>
          <NavIcon>
            <i className="icon ion-md-log-in" style={{ fontSize: '1.75em' }} />
          </NavIcon>
          <NavText>
            Sign up / Sign in
          </NavText>
        </NavItem>
      )
    }
  }
}

export class UserMenuItem extends React.Component {
  render() {
    if (this.props.session.user && !this.props.session.user.admin) {
      return (
        <React.Fragment>
          <Link prefetch href="/dashboard">
            <NavItem eventKey="tracking">
              <NavIcon>
                  <i className="icon ion-ios-stats" style={{ fontSize: '1.75em' }} />
              </NavIcon>
              <NavText>
                Tracking
              </NavText>
            </NavItem>
          </Link>
          <Link prefetch href="/reports">
            <NavItem eventKey="reports">
              <NavIcon>
                  <i className="icon ion-ios-paper" style={{ fontSize: '1.75em' }} />
              </NavIcon>
              <NavText>
                Reports
              </NavText>
            </NavItem>
          </Link>
        </React.Fragment>
      )
    } else {
      return(<div/>)
    }
  }
}

export class AdminMenuItem extends React.Component {
  render() {
    if (this.props.session.user && this.props.session.user.admin === true) {
      return (
        <React.Fragment>
          <Link prefetch href="/admin">
            <NavItem eventKey="admin">
              <NavIcon>
                  <i className="icon ion-ios-analytics" style={{ fontSize: '1.75em' }} />
              </NavIcon>
              <NavText>
                Admin
              </NavText>
            </NavItem>
          </Link>
        </React.Fragment>
      )
    } else {
      return(<div/>)
    }
  }
}