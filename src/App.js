import React from 'react';
import Login from './screen/login'
import Dashboard from './screen/dashboard'
import home from './config'
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom'

class Logout extends React.Component {
  
  constructor(props)
  {
    super(props);
    this.state = {
      logout : false
    }
  }
  async componentDidMount()
  {
    let call = await fetch(home+'/api/logout');
    let res = await call.json();
    if(res.oke)
    {
      await this.setState({ logout : true });
    }
  }

  render()
  {
    return (
    <div>{ this.state.logout ? <Redirect exact to="/" /> : <div>Đang đăng xuất...</div> }</div>
    )
  }
}

const App = () => (
  <Router>
    <Route exact path="/" component={Login} />
    <Route exact path="/logout" component={Logout} />
    <Route path="/dashboard" component={Dashboard} />
  </Router>
)

export default App;