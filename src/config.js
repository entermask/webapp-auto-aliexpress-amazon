
const home = 'https://714ali.vivoo.vn';

// const home = 'http://localhost:3333';

const isAuth = async () => {
    let login = false;
    let call = await fetch(home+'/api/login');
    let data = await call.json();
    if(!data.login)
      login = false;
    else
      login = true;
    return true;
    return login;
}

const getUser = async (username = 'admin') => { // fake
  let url = home+'/api/user/'+username;
  let call = await fetch(url);
  let data = await call.json();
  return data;
}

export default home;
export { isAuth, getUser }