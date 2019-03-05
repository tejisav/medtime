import fetch from 'isomorphic-fetch'
import { NextAuth } from 'next-auth/client'
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table'
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
      <Layout {...this.props} navmenu={false}>
        <h1 className="display-4">Clinic Administration</h1>
        <p className="lead text-muted ">
          List of new doctor signups
        </p>
        <Table />
        <hr className="mt-3"/>
        <p className="lead text-muted ">
          Assign Patients to Doctor
        </p>
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
      data: await User.list({
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
      _csrf: await NextAuth.csrfToken(),
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
      _csrf: await NextAuth.csrfToken(),
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
    
    const alert = (this.state.alertText === null) ? <div/> : <div className={`alert ${this.state.alertStyle}`} role="alert">{this.state.alertText}</div>

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