import React from 'react'
import Router from 'next/router'
import Link from 'next/link'
import fetch from 'isomorphic-fetch'
import { Row, Col, Form, FormGroup, Label, Input, Button } from 'reactstrap'
import { NextAuth } from 'next-auth/client'
import Page from '../components/page'
import Layout from '../components/layout'
import Unverified from '../components/unverified'
import Cookies from 'universal-cookie'
import ReactCrop from 'react-image-crop'

export default class extends Page {

  static async getInitialProps({req, res}) {
    let props = await super.getInitialProps({req})
    props.session = await NextAuth.init({force: true, req: req})
    props.linkedAccounts = await NextAuth.linked({ req })
    
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
    }
    
    return props
  }

  constructor(props) {
    super(props)
    this.state = {
      session: props.session,
      isSignedIn: (props.session.user) ? true : false,
      name: '',
      email: '',
      address: '',
      emailVerified: false,
      alertText: null,
      alertStyle: null,
      src: null,
      crop: {
        aspect: 1,
        width: 50,
        x: 0,
        y: 0,
      },
    }
    if (props.session.user) {
      this.state.name = props.session.user.name
      this.state.email = props.session.user.email
    }
    this.handleChange = this.handleChange.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }

  async componentDidMount() {
    const session = await NextAuth.init({ force: true })
    this.setState({
      session: session,
      isSignedIn: (session.user) ? true : false
    })

    /*====avatart */



    // If the user bounces off to link/unlink their account we want them to
    // land back here after signing in with the other service / unlinking.
    const cookies = new Cookies()
    cookies.set('redirect_url', window.location.pathname, { path: '/dashboard' })

    this.getProfile()
  }
  /*====avatart */
  onSelectFile = e => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () =>
        this.setState({ src: reader.result }),
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  onImageLoaded = (image, pixelCrop) => {
    this.imageRef = image;

    // Make the library regenerate aspect crops if loading new images.
    const { crop } = this.state;

    if (crop.aspect && crop.height && crop.width) {
      this.setState({
        crop: { ...crop, height: null },
      });
    } else {
      this.makeClientCrop(crop, pixelCrop);
    }
  };

  onCropComplete = (crop, pixelCrop) => {
    this.makeClientCrop(crop, pixelCrop);
  };

  onCropChange = crop => {
    this.setState({ crop });
  };
  getCroppedImg = (image, pixelCrop, fileName) => {
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        blob.name = fileName;
        window.URL.revokeObjectURL(this.fileUrl);
        this.fileUrl = window.URL.createObjectURL(blob);
        resolve(this.fileUrl);
      }, 'image/jpeg');
    });
  }
  async makeClientCrop(crop, pixelCrop) {
    if (this.imageRef && crop.width && crop.height) {
      const croppedImageUrl = await this.getCroppedImg(
        this.imageRef,
        pixelCrop,
        'newFile.jpeg',
      );
      this.setState({ croppedImageUrl });
    }
  }

  getProfile() {
    fetch('/account/user', {
      credentials: 'include'
    })
      .then(r => r.json())
      .then(user => {
        if (!user.name || !user.email) return
        this.setState({
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          address: user.address,
          srcAvatar: user.srcAvatar || ''
        })
      })

  }

  handleChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    })
  }

  async onSubmit(e) {
    // Submits the URL encoded form without causing a page reload
    e.preventDefault()

    this.setState({
      alertText: null,
      alertStyle: null
    })

    const formData = {
      // _csrf: await NextAuth.csrfToken(),
      name: this.state.name || '',
      email: this.state.email || '',
      address: this.state.address || '',
      src: this.state.croppedImageUrl || ''
    }

    // URL encode form
    // Note: This uses a x-www-form-urlencoded rather than sending JSON so that
    // the form also in browsers without JavaScript
    const encodedForm = Object.keys(formData).map((key) => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key])
    }).join('&')

    fetch('/account/user', {
      credentials: 'include',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: encodedForm
    })
      .then(async res => {
        if (res.status === 200) {
          this.getProfile()
          this.setState({
            alertText: 'Changes to your profile have been saved',
            alertStyle: 'alert-success',
          })
          // Force update session so that changes to name or email are reflected
          // immediately in the navbar (as we pass our session to it).
          this.setState({
            session: await NextAuth.init({ force: true }), // Update session data
            srcAvatar: this.state.croppedImageUrl
          })
        } else {
          this.setState({
            session: await NextAuth.init({ force: true }), // Update session data
            alertText: 'Failed to save changes to your profile',
            alertStyle: 'alert-danger',
          })
        }
      })
  }

  render() {
    
    if (this.props.session.user && this.props.session.user.signUpComplete) {
      if (this.props.session.user.type === "clinic" || this.props.session.user.type === "patient" || (this.props.session.user.type === "doctor" && this.props.session.user.clinicVerified)) {
        const alert = (this.state.alertText === null) ? <div /> : <div className={`alert ${this.state.alertStyle}`} role="alert">{this.state.alertText}</div>
        const { crop, croppedImageUrl, src } = this.state;
        return (
          <Layout {...this.props}>
            <Row className="mb-1">
              <Col xs="12 text-center">
                <h1 className="display-2">Your Account</h1>
                <p className="lead text-muted">
                  Edit your profile and link accounts
                </p>
              </Col>
            </Row>
            {alert}
            <Row className="mt-4">
              <Col xs="12" md={{ size: 9, offset: 2 }}>
                <Form method="post" action="/account/user" onSubmit={this.onSubmit}>
                  {/* <Input name="_csrf" type="hidden" value={this.state.session.csrfToken} onChange={() => { }} /> */}
                  <FormGroup row>
                    <Label sm={2}>Avatar:</Label>
                    <Col sm={10} md={8}>
                      <img width="100" height="100" src={this.state.srcAvatar ? this.state.srcAvatar : "/static/images/default.jpg"} />
                      <input type="file" className="ml-4" onChange={this.onSelectFile} />
                      {src && (
                        <ReactCrop src={src} crop={this.state.crop}
                          onImageLoaded={this.onImageLoaded}
                          onComplete={this.onCropComplete}
                          onChange={this.onCropChange} />
                      )}
                      {croppedImageUrl && <img alt="Crop" src={croppedImageUrl} />}
                    </Col>
                  </FormGroup>
                  <FormGroup row>
                    <Label sm={2}>Name:</Label>
                    <Col sm={10} md={8}>
                      <Input name="name" value={this.state.name} onChange={this.handleChange} />
                    </Col>
                  </FormGroup>
                  <FormGroup row>
                    <Label sm={2}>Email:</Label>
                    <Col sm={10} md={8}>
                      <Input name="email" value={(this.state.email.match(/.*@localhost\.localdomain$/)) ? '' : this.state.email} onChange={this.handleChange} />
                    </Col>
                  </FormGroup>
                  <FormGroup row>
                    <Label sm={2}>Address:</Label>
                    <Col sm={10} md={8}>
                      <Input name="address" value={this.state.address} onChange={this.handleChange} />
                    </Col>
                  </FormGroup>
                  <FormGroup row>
                    <Col sm={12} md={10}>
                      <p className="text-right">
                        <Button color="primary" type="submit" ><span className="icon icon-spin ion-md-refresh mr-2" />Save Changes</Button>
                      </p>
                    </Col>
                  </FormGroup>
                </Form>
              </Col>
              <Col xs="12" md={{ size: 4, offset: 4 }}>
                <LinkAccounts
                  session={this.props.session}
                  linkedAccounts={this.props.linkedAccounts}
                />
              </Col>
            </Row>
            <Row>
              <Col md={{ size: 8, offset: 2 }}>
                <h2>Delete your account</h2>
                <p>
                  If you delete your account it will be erased immediately.
                  You can sign up again at any time.
                </p>
                <Form id="signout" method="post" action="/account/delete">
                  {/* <input name="_csrf" type="hidden" value={this.state.session.csrfToken} /> */}
                  <Button type="submit" color="outline-danger"><span className="icon ion-md-trash mr-1"></span> Delete Account</Button>
                </Form>
              </Col>
            </Row>
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

export class LinkAccounts extends React.Component {
  render() {
    return (
      <React.Fragment>
        {
          Object.keys(this.props.linkedAccounts).map((provider, i) => {
            return <LinkAccount key={i} provider={provider} session={this.props.session} linked={this.props.linkedAccounts[provider]} />
          })
        }
      </React.Fragment>
    )
  }
}

export class LinkAccount extends React.Component {
  render() {
    if (this.props.linked === true) {
      return (
        <form method="post" action={`/auth/oauth/${this.props.provider.toLowerCase()}/unlink`}>
          {/* <input name="_csrf" type="hidden" value={this.props.session.csrfToken} /> */}
          <p>
            <button className="btn btn-block btn-outline-danger" type="submit">
              Unlink from {this.props.provider}
            </button>
          </p>
        </form>
      )
    } else {
      return (
        <p>
          <a className="btn btn-block btn-outline-primary" href={`/auth/oauth/${this.props.provider.toLowerCase()}`}>
            Link with {this.props.provider}
          </a>
        </p>
      )
    }
  }
}