import React from 'react';
import './../res/css/Login.css';
import home, { isAuth } from './../config'
import { Redirect } from 'react-router-dom'

class Login extends React.Component {
  
  constructor(props)
  {
    super(props);
    this.username = React.createRef();
    this.password = React.createRef();
    this.state = {
      notice : null
    }
  }

  async componentWillMount() {
    let login = await isAuth();
    if(login)
      this.setState({ notice: <Redirect to="/dashboard" /> })
  }

  Login = async (e) => {
    e.preventDefault();
    let login;
    this.username.current.blur();
    this.password.current.blur();
    await fetch(home+'/api/login/'+this.username.current.value+'/'+this.password.current.value)
    .then((r) => r.json()).then((r) => {
        if(!r.login)
          login = false;
        else
          login = true;
      });
      if(login)
      {
        this.setState({ notice: <Redirect to="/dashboard" /> })
      } else
        this.setState({ notice: <div className="alert alert-danger" role="alert">Sai tên tài khoản hoặc mật khẩu ! </div> })
  }

  render(){
    return (
      <div className="container">
        <div className="flexLogin">
            <div className="login">
              <form onSubmit={this.Login}>
                <h2 className="mb-4 text-center"># Project 714</h2>
                { this.state.notice || this.state.notice }
                <div className="form-group">
                  <label><i className="fal fa-user fa-fw" /> Tên đăng nhập</label>
                  <input required ref={this.username} type="text" className="form-control" />
                </div>
                <div className="form-group">
                  <label><i className="fal fa-lock fa-fw" /> Mật khẩu</label>
                  <input required ref={this.password} type="password" className="form-control" />
                </div>
                <div className="text-center">
                  <button type="submit" className="btn btn-danger mx-0">Đăng Nhập</button>
                </div>
              </form>
            </div>
        </div>
      </div>
    );
  }
}

export default Login;
