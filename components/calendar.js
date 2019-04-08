import React from 'react'
import BigCalendar from 'react-big-calendar'
import moment from 'moment'
import Loader from './loader'

const localizer = BigCalendar.momentLocalizer(moment) 

export default class extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      alertText: null,
      alertStyle: null,
      updating: false,
      events: []
    }
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
    fetch(`/account/schedule`, {
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
      if (!data || !data.events.length) {
        return
      }
      for (let i = 0; i < data.events.length; i++) {
        data.events[i].start = new Date(data.events[i].start)
        data.events[i].end = new Date(data.events[i].end)
      }
      this.setState({
        events: data.events
      })
    })
    .catch(() => Promise.reject(Error('Error trying to get events')))
  }

  Event = ({ event }) => {
    return (
      <span>
        <strong>{event.title}</strong>
      </span>
    )
  }

  handleSelect = (event) => {
    if (!event.completed && event.start < new Date() && event.end > new Date() && this.props.session.user.type === "patient") {
      console.log(event)
      this.setState({
        alertText: null,
        alertStyle: null
      })

      let data = {
        event: event
      }
  
      fetch('account/event', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(async res => {
        if (res.status === 200) {
          event.completed = true
          this.forceUpdate()
        } else {
          this.setState({
            alertText: 'Error updating status',
            alertStyle: 'alert-danger'
          })
        }
      })
      .catch(error => {
        console.error('Error:', error)
        this.setState({
          alertText: 'Error updating status',
          alertStyle: 'alert-danger'
        })
      })
    }
  }

  customEventPropGetter = (event) => {
    if (event.completed) {
      return {
        style: {
          backgroundColor: 'green'
        }
      }
    } else if (event.missed) {
      return {
        style: {
          backgroundColor: 'red'
        }
      }
    } else if (event.start < new Date() && event.end > new Date()) {
      return {
        style: {
          backgroundColor: '#007bff'
        }
      }
    } else {
      return {
        style: {
          backgroundColor: 'grey'
        }
      }
    }
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
          <BigCalendar
            selectable
            localizer={localizer}
            events={this.state.events}
            defaultView={BigCalendar.Views.DAY}
            views={{ week: true, day: true, agenda: true }}
            scrollToTime={new Date(moment().add(-2, 'hours'))}
            onSelectEvent={this.handleSelect}
            eventPropGetter={this.customEventPropGetter}
            components={{ event: this.Event }}
          />
        </React.Fragment>
      )
    }
  }
}