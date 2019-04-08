import React from 'react'
import Loader from './loader'
import { Row, Col, Card, CardHeader, CardBody, Form, FormGroup, Label, Input, Button } from 'reactstrap';
import ReactChartkick, { LineChart } from 'react-chartkick'
import Chart from 'chart.js'
 
ReactChartkick.addAdapter(Chart)

export default class extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      alertText: null,
      alertStyle: null,
      updating: false,
      improvement: null,
      startDate: null,
      endDate: null
    }

    this.updateData = this.updateData.bind(this)
  }

  async componentDidMount() {
    this.setState({
      updating: true
    })
    await this.updateData()
    this.setState({
      updating: false
    })
  }

  async updateData() {
    fetch(`/account/improvement`, {
      credentials: 'same-origin'
    })
    .then(response => {
      if (response.ok) {
        return Promise.resolve(response.json())
      } else {
        return Promise.reject(Error('HTTP error when trying to get events'))
      }
    })
    .then(async data => {
      if (!data) {
        return
      }
      this.setState({
        improvement: data.improvement || null,
        startDate: data.startDate || null,
        endDate: data.endDate || null
      })
    })
  }

  render() {

    const alert = (this.state.alertText === null) ? <div/> : <div className={`alert ${this.state.alertStyle}`} role="alert">{this.state.alertText}</div>

    if (this.state.updating) {
      return (
        <Loader/>
      )
    } else {
      return (
        <React.Fragment>
          {alert}
          <Row>
            <Col xs={12} md={6}>
              <ImprovementForm improvement={this.state.improvement} startDate={this.state.startDate} endDate={this.state.endDate} updateData={this.updateData} session={this.props.session} />
            </Col>
            <Col xs={12} md={6}>
              <ImprovementChart improvement={this.state.improvement} />
            </Col>
          </Row>
        </React.Fragment>
      )
    }
  }
}

export class ImprovementForm extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      selectedFeedback: ''
    }
  }

  handleFeedbackChange = (changeEvent) => {
    this.setState({
      selectedFeedback: changeEvent.target.value
    })
  }

  handleSubmit = (e) => { 
    e.preventDefault()

    let currentImprovement = 0
    if (this.props.improvement) {
      currentImprovement = Object.values(this.props.improvement)[Object.values(this.props.improvement).length - 1]
    }

    let oneDay = 24*60*60*1000 // hours*minutes*seconds*milliseconds
    var firstDate = new Date(this.props.endDate)
    var secondDate = new Date(new Date().toDateString())

    let daysLeft = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay))) + 1;

    let newImprovement = ((100 - currentImprovement) / daysLeft) + currentImprovement

    if (this.state.selectedFeedback === 'option1') {
      newImprovement = ((100 - currentImprovement) / daysLeft) + currentImprovement
      if (newImprovement > 100) {
        newImprovement = 100
      }
    } else if (this.state.selectedFeedback === 'option2') {
      newImprovement = currentImprovement - ((100 - currentImprovement) / daysLeft)
      if (newImprovement < 0) {
        newImprovement = 0
      }
    } else {
      newImprovement = currentImprovement
    }
    
    let data = {
      ...this.props.improvement,
      [new Date().toISOString().split('T')[0]]: newImprovement
    }

    fetch('account/improvement', {
      method: 'POST',
      body: JSON.stringify(data),
      headers:{
        'Content-Type': 'application/json'
      }
    })
    .then(async res => {
      if (res.status === 200) {
        this.props.updateData()
      } else {
        this.setState({
          alertText: 'Error submitting feedback',
          alertStyle: 'alert-danger'
        })
      }
    })
    .catch(error => {
      console.error('Error:', error)
      this.setState({
        alertText: 'Error submitting feedback',
        alertStyle: 'alert-danger'
      })
    })
  }

  render() {
    if (this.props.session.user.type === "patient") {
        if ( new Date(new Date().toDateString()) >= new Date(this.props.startDate) && new Date(new Date().toDateString()) <= new Date(this.props.endDate) && (!this.props.improvement || !this.props.improvement.hasOwnProperty(new Date().toISOString().split('T')[0]))) {
        return (
          <Card>
            <CardHeader>Improvement Feedback - {new Date().toDateString()}</CardHeader>
            <CardBody>
              <Form onSubmit={this.handleSubmit}>
                <FormGroup tag="fieldset">
                  <legend>Please select the right option about your current health :-</legend>
                  <FormGroup check>
                    <Label check>
                      <Input type="radio" name="radioFeedback" value="option1" checked={this.state.selectedFeedback === 'option1'} onChange={this.handleFeedbackChange} />{' '}
                      Condition is improving
                    </Label>
                  </FormGroup>
                  <FormGroup check>
                    <Label check>
                      <Input type="radio" name="radioFeedback" value="option2" checked={this.state.selectedFeedback === 'option2'} onChange={this.handleFeedbackChange} />{' '}
                      Condition is worsening
                    </Label>
                  </FormGroup>
                  <FormGroup check>
                    <Label check>
                      <Input type="radio" name="radioFeedback" value="option3" checked={this.state.selectedFeedback === 'option3'} onChange={this.handleFeedbackChange} />{' '}
                      No improvement in condition
                    </Label>
                  </FormGroup>
                </FormGroup>
                <Button type="submit">Submit</Button>
              </Form>
            </CardBody>
          </Card>
        )
      } else if (this.props.improvement && this.props.improvement.hasOwnProperty(new Date().toISOString().split('T')[0])) {
        return (
          <div className="h-100 d-flex align-items-center justify-content-center">
            <p className="lead">Thanks for providing the feedback!</p>
          </div>
        )
      } else {
        return (
          <div className="h-100 d-flex align-items-center justify-content-center">
            <p className="lead">The medication hasn't started yet!</p>
          </div>
        )
      }
    } else {
      return (
        <div className="h-100 d-flex align-items-center justify-content-center">
          <p className="lead">Only patients can provide feedback!</p>
        </div>
      )
    }
  }
}

export class ImprovementChart extends React.Component {

  render() {
    
    if (this.props.improvement) {
      return (
        <LineChart min={0} max={100} xtitle="Date" ytitle="Improvement" suffix="%" label="Patient Improvement" legend={true} colors={["#0c5c7e", "#0c5c7e"]} data={this.props.improvement} />
      )
    } else {
      return (
        <div className="h-100 d-flex align-items-center justify-content-center">
          <p className="lead">No Improvemnt data added yet!</p>
        </div>
      )
    }
  }
}