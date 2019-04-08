import Layout from '../components/layout'

export default class extends React.Component {
  
  render() {
    return (
      <Layout {...this.props} container={false}>
        <div className="text-center mt-5 mb-5">
          <p className="lead">Please first select a user from top!</p>
        </div>
      </Layout>
    )
  }
}