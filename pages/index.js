import React from 'react'
import Router from 'next/router'
import Link from 'next/link'
import { Container, Row, Col, Button, Table, Form, FormGroup, Label, Input, Modal, ModalHeader, ModalBody } from 'reactstrap'
import { NextAuth } from 'next-auth/client'
import Page from '../components/page'
import Layout from '../components/layout'
import Unverified from '../components/unverified'
import SelectUser from '../components/select-user'
import Improvement from '../components/improvement'
import dynamic from 'next/dynamic'

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
  
  constructor(props) {
    super(props)
    this.state = {
      modal: false
    }
    this.toggleModal = this.toggleModal.bind(this)
  }
  
  async toggleModal(e) {
    if (e) e.preventDefault()
    this.setState({
      modal: !this.state.modal
    })
  }

  render() {
    if (this.props.session.user && this.props.session.user.signUpComplete) {
      if (this.props.session.user.type === "patient" || (this.props.session.user.type === "doctor" && this.props.session.user.clinicVerified)) {
        if (this.props.session.user.selectedUser) {
          const addScheduleButton = (this.props.session.user.type === "doctor" && this.props.session.user.clinicVerified) ? <Button color="primary" size="lg" onClick={this.toggleModal}>Add Schedule</Button> : <div/>
          return (
            <Layout {...this.props} container={false}>
              <Container className="mt-2 mb-2 text-center">
                <Row className="mb-4">
                  <Col xs={12} md={8} className="mt-4">
                    <div className="h-100 d-flex align-items-center">
                      <span className="colored-circles bg-primary mr-2"></span> Take Now
                      <span className="colored-circles bg-success mr-2 ml-3"></span> Taken
                      <span className="colored-circles bg-danger mr-2 ml-3"></span> Missed
                      <span className="colored-circles bg-secondary mr-2 ml-3"></span> Locked
                    </div>
                  </Col>
                  <Col xs={12} md={4} className="mt-4 schedule-button">
                    {addScheduleButton}
                  </Col>
                </Row>
                <CalendarWithNoSSR session={this.props.session} />
                <br />
                <br />
                <Improvement session={this.props.session} />
              </Container>
              <AddScheduleModal modal={this.state.modal} toggleModal={this.toggleModal} session={this.props.session} />
            </Layout>
          )
        } else {
          return(<SelectUser {...this.props}/>)
        }
      } else {
        return(<Unverified  {...this.props}/>)
      }
    } else {
      return(<div/>)
    }
  }
}

export class AddScheduleModal extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      medicines: [{
        name: "",
        startDate: "",
        endDate: "",
        timesPerDay: "",
        time1: "",
        time2: "",
        time3: ""
      }],
      alertText: null,
      alertStyle: null
    }
  }

  handleSubmit = (e) => { 

    e.preventDefault()
    
    this.setState({
      alertText: null,
      alertStyle: null
    })

    if (this.state.medicines.length <= 0) {
      this.setState({
        alertText: 'Please add medicine first',
        alertStyle: 'alert-danger'
      })
      return
    }

    let events = [], j = 0, startDate = null, endDate = null
    for (let i = 0; i < this.state.medicines.length; i++) {
      if (!this.state.medicines[i].name || !this.state.medicines[i].startDate || !this.state.medicines[i].endDate || this.state.medicines[i].timesPerDay < 1 || !this.state.medicines[i].timesPerDay > 3 || !this.state.medicines[i].time1 || (this.state.medicines[i].timesPerDay > 1 && !this.state.medicines[i].time2) || (this.state.medicines[i].timesPerDay > 2 && !this.state.medicines[i].time3)) {
        this.setState({
          alertText: 'Please complete the form first',
          alertStyle: 'alert-danger',
        })
        return;
      } else {
        if (!startDate || startDate > new Date(this.state.medicines[i].startDate + "PDT")) {
          startDate = new Date(this.state.medicines[i].startDate + "PDT")
          console.log(startDate)
        }
        if (!endDate || endDate < new Date(this.state.medicines[i].endDate + "PDT")) {
          endDate = new Date(this.state.medicines[i].endDate + "PDT")
          console.log(endDate)
        }
        for (let s = new Date(this.state.medicines[i].startDate + "PDT"); s <= new Date(this.state.medicines[i].endDate + "PDT"); s.setDate(s.getDate() + 1)) {
          let dateTime1WithGap = new Date(s.toDateString() + " " + this.state.medicines[i].time1)
          dateTime1WithGap.setHours(dateTime1WithGap.getHours() + 1)
          events.push({
            id: j,
            title: this.state.medicines[i].name,
            start: new Date(s.toDateString() + " " + this.state.medicines[i].time1),
            end: dateTime1WithGap,
            completed: false,
            missed: false
          })
          j++
          if (this.state.medicines[i].timesPerDay > 1) {
            let dateTime2WithGap = new Date(s.toDateString() + " " + this.state.medicines[i].time2)
            dateTime2WithGap.setHours(dateTime2WithGap.getHours() + 1)
            events.push({
              id: j,
              title: this.state.medicines[i].name,
              start: new Date(s.toDateString() + " " + this.state.medicines[i].time2),
              end: dateTime2WithGap,
              completed: false,
              missed: false
            })
            j++
          }
          if (this.state.medicines[i].timesPerDay > 2) {
            let dateTime3WithGap = new Date(s.toDateString() + " " + this.state.medicines[i].time3)
            dateTime3WithGap.setHours(dateTime3WithGap.getHours() + 1)
            events.push({
              id: j,
              title: this.state.medicines[i].name,
              start: new Date(s.toDateString() + " " + this.state.medicines[i].time3),
              end: dateTime3WithGap,
              completed: false,
              missed: false
            })
            j++
          }
        }
      }
    }
    
    let data = {
      startDate: startDate,
      endDate: endDate,
      medicines: this.state.medicines,
      events: events
    }

    fetch('account/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
      headers:{
        'Content-Type': 'application/json'
      }
    })
    .then(async res => {
      if (res.status === 200) {
        Router.push('/dashboard')
      } else {
        this.setState({
          alertText: 'Error adding schedule',
          alertStyle: 'alert-danger'
        })
      }
    })
    .catch(error => {
      console.error('Error:', error)
      this.setState({
        alertText: 'Error adding schedule',
        alertStyle: 'alert-danger'
      })
    })
  }

  handleChange = (e, name) => {
    if (["name", "startDate", "endDate", "timesPerDay", "time1", "time2", "time3"].includes(name) ) {
      let medicines = [...this.state.medicines]
      medicines[e.target.dataset.id][name] = e.target.value
      this.setState({ medicines })
    } else {
      this.setState({ [e.target.name]: e.target.value })
    }
  }

  addMedicine = () => {
    this.setState((prevState) => ({
      medicines: [...prevState.medicines, {
        name: "",
        startDate: "",
        endDate: "",
        timesPerDay: "",
        time1: "",
        time2: "",
        time3: ""
      }]
    }))
  }

  deleteMedicine = () => {
    this.setState((prevState) => ({
      medicines: [...prevState.medicines.slice(0, -1)]
    }))
  }

  render() {
    if (this.props.session.user.type === "doctor" && this.props.session.user.clinicVerified) {

      let {medicines} = this.state

      const alert = (this.state.alertText === null) ? <div/> : <div className={`alert ${this.state.alertStyle}`} role="alert">{this.state.alertText}</div>

      return (
        <Modal isOpen={this.props.modal} toggle={this.props.toggleModal} style={{maxWidth: 'max-content'}}>
          <ModalHeader>Add New Schedule</ModalHeader>
          <ModalBody className="text-center" style={{padding: '1em 2em', overflow: 'auto'}}>
            {alert}
            <div className="float-left">
              <Button outline color="primary" onClick={this.addMedicine}>Add Medicine</Button>
            </div>
            <div className="float-right">
              <Button outline color="danger" onClick={this.deleteMedicine}>Delete Medicine</Button>
            </div>
            <Form className="mt-5" onSubmit={this.handleSubmit}>
              <Table bordered>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Times/Day</th>
                    <th>Time #1</th>
                    <th>Time #2</th>
                    <th>Time #3</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    medicines.map((val, idx)=> {
                      let nameId = `name-${idx}`, startId = `start-${idx}`, endId = `end-${idx}`, tpdId = `tpd-${idx}`, time1Id = `time1-${idx}`, time2Id = `time2-${idx}`, time3Id = `time3-${idx}`
                      return (
                        <tr key={idx}>
                          <td scope="row">
                            <FormGroup>
                              <Label for={nameId} hidden>{`Medicine #${idx + 1}`}</Label>
                              <Input type="text" name={nameId} data-id={idx} id={nameId} value={medicines[idx].name} onChange={(e) => this.handleChange(e, "name")}/>
                            </FormGroup>
                          </td>
                          <td>
                            <FormGroup>
                              <Label for={startId} hidden>Start Date</Label>
                              <Input type="date" name={startId} data-id={idx} id={startId} value={medicines[idx].startDate} onChange={(e) => this.handleChange(e, "startDate")}/>
                            </FormGroup>
                          </td>
                          <td>
                            <FormGroup>
                              <Label for={endId} hidden>End Date</Label>
                              <Input type="date" name={endId} data-id={idx} id={endId} value={medicines[idx].endDate} onChange={(e) => this.handleChange(e, "endDate")}/>
                            </FormGroup>
                          </td>
                          <td>
                            <FormGroup>
                              <Label for={tpdId} hidden>Times Per Day</Label>
                              <Input type="number" name={tpdId} data-id={idx} id={tpdId} value={medicines[idx].timesPerDay} min="1" max="3" onChange={(e) => this.handleChange(e, "timesPerDay")}/>
                            </FormGroup>
                          </td>
                          <td>
                            <FormGroup>
                              <Label for={time1Id} hidden>Time #1</Label>
                              <Input type="time" name={time1Id} data-id={idx} id={time1Id} value={medicines[idx].time1} disabled={medicines[idx].timesPerDay < 1} onChange={(e) => this.handleChange(e, "time1")}/>
                            </FormGroup>
                          </td>
                          <td>
                            <FormGroup>
                              <Label for={time2Id} hidden>Time #1</Label>
                              <Input type="time" name={time2Id} data-id={idx} id={time2Id} value={medicines[idx].time2} disabled={medicines[idx].timesPerDay < 2} onChange={(e) => this.handleChange(e, "time2")}/>
                            </FormGroup>
                          </td>
                          <td>
                            <FormGroup>
                              <Label for={time3Id} hidden>Time #1</Label>
                              <Input type="time" name={time3Id} data-id={idx} id={time3Id} value={medicines[idx].time3} disabled={medicines[idx].timesPerDay < 3} onChange={(e) => this.handleChange(e, "time3")}/>
                            </FormGroup>
                          </td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </Table>
              <Button color="success">Submit</Button>
            </Form>
          </ModalBody>
          <style jsx global>{`
            td {
              padding: 0 !important;
            }

            .form-group {
              margin: 0 !important;
            }
          `}</style>
        </Modal>
      )
    } else { 
      return(<div />)
    }
  }
}