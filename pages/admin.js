import fetch from 'isomorphic-fetch'
import { NextAuth } from 'next-auth/client'
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table'
import SelectSearch from 'react-select-search'
import Page from '../components/page'
import Layout from '../components/layout'
import Loader from '../components/loader'
import User from '../models/user'

export default class extends Page {
  constructor(props) {
    super(props)
  }

  render() {
    if (!this.props.session.user || this.props.session.user.admin !== true)
      return super.adminAccessOnly()

    return (
      <Layout {...this.props}>
        <h1 className="display-4">Clinic Administration</h1>
        <p className="lead text-muted ">
          List of new doctor signups
        </p>
        <Table />
        <hr className="mt-3"/>
        <p className="lead text-muted ">
          Assign Patients to Doctor
        </p>
        <Assign />
      </Layout>
    )
  }
}

export class Table extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      data: null,
      updating: true,
      alertText: null,
      alertStyle: null
    }

    this.options = {
      onPageChange: this.onPageChange.bind(this),
      onSizePerPageList: this.sizePerPageListChange.bind(this),
      page: 1,
      pageStartIndex: 1,
      paginationPosition: 'top',
      paginationSize: 5,
      sizePerPage: 10,
      sizePerPageList: [ 10, 50, 100 ]
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

  async onPageChange(page, sizePerPage) {
    this.options.page = page
    this.options.sizePerPage = sizePerPage
    await this.updateData()
  }

  async sizePerPageListChange(sizePerPage) {
    this.options.sizePerPage = sizePerPage
    await this.updateData()
  }

  async updateData() {
    this.setState({
      data: await User.unverifiedList({
          page: this.options.page,
          size: this.options.sizePerPage
        })
    })
  }

  async verifyUser(row) {
    
    this.setState({
      alertText: null,
      alertStyle: null
    })

    const data = {
      // _csrf: await NextAuth.csrfToken(),
      id: row._id
    }

    const encodedData = Object.keys(data).map((key) => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(data[key])
    }).join('&')
    
    fetch('/admin/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: encodedData
    })
    .then(async res => {
      if (res.status === 200) {
        this.setState({
          alertText: `Account: ${row.email} verified successfully`,
          alertStyle: 'alert-success',
        })
        this.updateData()
      } else {
        this.setState({
          alertText: `Failed to verify account: ${row.email}`,
          alertStyle: 'alert-danger',
        })
      }
    })
  }

  async deleteUser(row) {
    
    this.setState({
      alertText: null,
      alertStyle: null
    })

    const data = {
      // _csrf: await NextAuth.csrfToken(),
      id: row._id
    }

    const encodedData = Object.keys(data).map((key) => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(data[key])
    }).join('&')
    
    fetch('/admin/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: encodedData
    })
    .then(async res => {
      if (res.status === 200) {
        this.setState({
          alertText: `Account: ${row.email} deleted successfully`,
          alertStyle: 'alert-success',
        })
        this.updateData()
      } else {
        this.setState({
          alertText: `Failed to delete account: ${row.email}`,
          alertStyle: 'alert-danger',
        })
      }
    })
  }
  
  buttonFunctions(cell, row) {     
    return (
      <React.Fragment>
        <button type="button" onClick={() => {this.verifyUser(row)}} className="btn btn-success">
          <span className="icon ion-ios-checkmark-circle-outline"></span> Verify
        </button>
        <button type="button" onClick={() => {this.deleteUser(row)}} className="btn btn-danger ml-2">
          <span className="icon ion-ios-trash"></span> Delete
        </button>
      </React.Fragment>
    )
  }
  
  render() {
    if (typeof window === 'undefined')
      return (<p>This page requires JavaScript.</p>)
    
    const alert = (this.state.alertText === null) ? <div/> : <div className={`alert text-center ${this.state.alertStyle}`} role="alert">{this.state.alertText}</div>

    const data = (this.state.data && this.state.data.users) ? this.state.data.users : []
    const totalSize = (this.state.data && this.state.data.total) ? this.state.data.total : 0

    if (this.state.updating)
      return (<Loader/>)

    const numberTo = (this.options.page * this.options.sizePerPage < totalSize) ? (this.options.page * this.options.sizePerPage) : totalSize
    const numberFrom = numberTo - data.length + 1

    return (
      <React.Fragment>
        {alert}
        <BootstrapTable pagination hover bordered={false}
          remote={true}
          data={data}
          fetchInfo={ {dataTotalSize: totalSize} }
          options={ this.options }>
            <TableHeaderColumn isKey dataField="_id">ID</TableHeaderColumn>
            <TableHeaderColumn dataField="name">Name</TableHeaderColumn>
            <TableHeaderColumn dataField="email">Email</TableHeaderColumn>
            <TableHeaderColumn dataField="button" dataFormat={this.buttonFunctions.bind(this)}></TableHeaderColumn>
        </BootstrapTable>
        <p className="mt-2 text-muted text-right">
          Displaying <strong>{numberFrom}-{numberTo}</strong> of <strong>{totalSize}</strong>
        </p>
      </React.Fragment>
    )
  }
}

export class Assign extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      updating: true,
      alertText: null,
      alertStyle: null,
      doctors: [],
      patients: [],
      doctorSelected: "",
      patientsSelected: []
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
    fetch(`/account/users`, {
      credentials: 'same-origin'
    })
    .then(response => {
      if (response.ok) {
        return Promise.resolve(response.json())
      } else {
        return Promise.reject(Error('HTTP error when trying to list users'))
      }
    })
    .then(data => {
      if (!data.users.length) {
        return
      }

      let docs = [], pats = []
      data.users.forEach(function (user) {
        if (user.type === "doctor") {
          docs.push({ name: user.name, value: user._id, photo: user.srcAvatar, patients: user.patients ? user.patients.split(',') : [] })
        } else if (user.type === "patient") {
          pats.push({ name: user.name, value: user._id, photo: user.srcAvatar })
        }
      })
      this.setState({
        doctors: docs.length ? docs : [],
        doctorSelected: docs.length && docs[0].value ? docs[0].value : "",
        patients: pats.length ? pats : [],
        patientsSelected: docs.length && docs[0].patients ? docs[0].patients : []
      })
    })
    .catch(() => Promise.reject(Error('Error trying to list users')))
  }

  changeDoctor(value) {
    this.setState({
      doctorSelected: value.value,
      patientsSelected: value.patients.length ? value.patients : []
    })
  }

  async assignPatients() {

    this.setState({
      alertText: null,
      alertStyle: null,
      updating: true
    })

    const data = {
      // _csrf: await NextAuth.csrfToken(),
      doctorID: this.state.doctorSelected,
      patients: this.state.patientsSelected
    }

    const encodedData = Object.keys(data).map((key) => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(data[key])
    }).join('&')
    
    fetch('/admin/assign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: encodedData
    })
    .then(async res => {
      if (res.status === 200) {
        this.setState({
          alertText: `Patients successfully assigned`,
          alertStyle: 'alert-success',
          updating: false
        })
        this.updateData()
      } else {
        this.setState({
          alertText: `Failed to assign patients`,
          alertStyle: 'alert-danger',
          updating: false
        })
      }
    })
  }

  renderDoctors(option) {
    const imgStyle = {
      borderRadius: '50%',
      verticalAlign: 'middle',
      marginRight: 10,
    };
  
    return (<span><img alt="" style={imgStyle} width="40" height="40" src={option.photo ? option.photo : "/static/images/default.jpg"} /><span>{option.name}</span></span>);
  }

  renderPatients(option, state) {
    if (state.value !== this.state.patientsSelected) {
      state.value = this.state.patientsSelected
    
      this.forceUpdate()
    }
    const imgStyle = {
      borderRadius: '50%',
      verticalAlign: 'middle',
      marginRight: 10,
    };
  
    return (<span><img alt="" style={imgStyle} width="40" height="40" src={option.photo ? option.photo : "/static/images/default.jpg"} /><span>{option.name}</span></span>);
  }

  render() {
    if (this.state.doctors.length > 0 && this.state.patients.length > 0 && !this.state.updating) {
      
      const alert = (this.state.alertText === null) ? <div/> : <div className={`alert text-center ${this.state.alertStyle}`} role="alert">{this.state.alertText}</div>
    
      return (
        <React.Fragment>
          {alert}
          <div className="d-flex justify-content-center">
            <SelectSearch
              name="doctors"
              value={this.state.doctorSelected}
              height={172}
              options={this.state.doctors}
              placeholder="Search doctors"
              onChange={this.changeDoctor.bind(this)}
              renderOption={this.renderDoctors}
            />
          </div>
          <br />
          <div className="d-flex justify-content-center">
            <SelectSearch
              name="patients"
              multiple
              value={this.state.patientsSelected}
              height={172}
              options={this.state.patients}
              placeholder="Search patients"
              renderOption={this.renderPatients.bind(this)}
            />
          </div>
          <br />
          <div className="d-flex justify-content-center">
            <button type="button" onClick={this.assignPatients.bind(this)} className="btn btn-primary">
              Update
            </button>
          </div>
      </React.Fragment>
      )
    } else if (this.state.updating) {
      return (
        <Loader/>
      )
    } else {
      return (
        <p className="text-center">
          No patients or doctors to assign
        </p>
      )
    }
  }
}