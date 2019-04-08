import Layout from '../components/layout'

export default class extends React.Component {
  
  render() {
    return (
      <Layout {...this.props} container={false}>
        <div className="text-center mt-5 mb-5">
          <p className="lead">Doctor account needs to be verified by clinic first!</p>
        </div>
      </Layout>
    )
  }
}