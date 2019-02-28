import React from 'react'
import Router from 'next/router'
import Link from 'next/link'
import Cookies from 'universal-cookie'
import { NextAuth } from 'next-auth/client'

export default class extends React.Component {
  
  constructor(props) {
    super(props)
    this.state = {
      email: '',
      password: '',
      session: this.props.session,
      submitting: false
    }
    this.handleEmailChange = this.handleEmailChange.bind(this)
    this.handlePasswordChange = this.handlePasswordChange.bind(this)
    this.handleSignInSubmit = this.handleSignInSubmit.bind(this)
  }

  handleEmailChange(event) {
    this.setState({
      email: event.target.value.trim()
    })
  }

  handlePasswordChange(event) {
    this.setState({
      password: event.target.value.trim()
    })
  }
  
  handleSignInSubmit(event) {
    event.preventDefault()
    
    if (!this.state.email || !this.state.password) return

    this.setState({
      submitting: true
    })

    // Save current URL so user is redirected back here after signing in
    const cookies = new Cookies()
    cookies.set('redirect_url', window.location.pathname, { path: '/' })

    // An object passed NextAuth.signin will be passed to your signin() function
    NextAuth.signin({
      email: this.state.email,
      password: this.state.password
    })
    .then(() => {
      Router.push(`/auth/callback`)
    })
    .catch(() => {
      Router.push(`/auth/error?action=signin&type=credential&email=${this.state.email}&password=${this.state.password}`)
    })
  }
  
  render() {
    if (this.props.session.user) {
      return(<div/>)
    } else {
      return (
        <div className="container">
          <div className="row">
            <div className="col-sm-12 col-md-10 col-lg-8 col-xl-7 mr-auto ml-auto">
              <div className="card mt-3 mb-3">
                <h4 className="card-header">Credentials</h4>
                <div className="card-body pb-0">
                  <form id="signin" method="post" action="/auth/signin" onSubmit={this.handleSignInSubmit}>
                    <input name="_csrf" type="hidden" value={this.state.session.csrfToken}/>
                    <p>
                      <label htmlFor="email">Email address</label><br/>
                      <input name="email" type="text" placeholder="j.smith@example.com" id="email" className="form-control" value={this.state.email} onChange={this.handleEmailChange}/>
                    </p>
                    <p>
                      <label htmlFor="password">Password</label><br/>
                      <input name="password" type="password" placeholder="" id="password" className="form-control" value={this.state.password} onChange={this.handlePasswordChange}/>
                    </p>
                    <p className="text-right">
                      <button id="submitButton" type="submit" className="btn btn-outline-primary">Sign in</button>
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center">
            <Link href="/auth"><a>Back</a></Link>
          </p>
        </div>
      )
    }
  }
}