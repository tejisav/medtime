import React from 'react'
import BigCalendar from 'react-big-calendar'
import moment from 'moment'

const localizer = BigCalendar.momentLocalizer(moment) 

export default class extends React.Component {
  constructor(props) {
    super(props)

    this.state = { 
      events: [
        {
          id: 0,
          title: 'Combiflame',
          start: new Date(2019, 3, 8, 8, 0, 0),
          end: new Date(2019, 3, 8, 9, 0, 0),
        },
        {
          id: 1,
          title: 'Metamorphine',
          start: new Date(2019, 3, 8, 8, 0, 0),
          end: new Date(2019, 3, 8, 9, 0, 0),
        },
        {
          id: 2,
          title: 'Combiflame',
          start: new Date(2019, 3, 8, 19, 0, 0),
          end: new Date(2019, 3, 8, 20, 0, 0),
        },
        {
          id: 3,
          title: 'Metamorphine',
          start: new Date(2019, 3, 8, 19, 0, 0),
          end: new Date(2019, 3, 8, 20, 0, 0),
        },
        {
          id: 4,
          title: 'Advil',
          start: new Date(2019, 3, 8, 13, 0, 0),
          end: new Date(2019, 3, 8, 14, 0, 0),
        },
        {
          id: 5,
          title: 'Motrin IB',
          start: new Date(2019, 3, 8, 13, 0, 0),
          end: new Date(2019, 3, 8, 14, 0, 0),
        }
      ] 
    }
  }

  handleSelect = ({ start, end }) => {
    const title = window.prompt('New Event name')
    if (title)
      this.setState({
        events: [
          ...this.state.events,
          {
            start,
            end,
            title,
          },
        ],
      })
  }

  render() {
    return (
      <BigCalendar
        selectable
        localizer={localizer}
        events={this.state.events}
        defaultView={BigCalendar.Views.DAY}
        scrollToTime={new Date(1970, 1, 1, 6)}
        defaultDate={new Date(2019, 3, 8)}
        onSelectEvent={event => alert(event.title)}
        onSelectSlot={this.handleSelect}
      />
    )
  }
}