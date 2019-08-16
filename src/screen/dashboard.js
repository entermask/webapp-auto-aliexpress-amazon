import React from 'react'
import home, { isAuth, getUser } from '../config'
import { Redirect, Link, Route, BrowserRouter as Router } from 'react-router-dom'
import './../res/css/dashboard.css';
import io from 'socket.io-client';
import { createStore, combineReducers  } from 'redux'

  function currentMenu(state = 'dashboard', action)
  {
    if(action.type !== 'updateTke')
        state = action.type
    return state;
  }

  function analytics(state, action)
  {
      return true;
  }
  
  const reducer = combineReducers({ analytics, currentMenu });
  // Create a Redux store holding the state of your app.
  // Its API is { subscribe, dispatch, getState }.
  const store = createStore(reducer)

  class AutoPost extends React.Component {
    componentWillMount()
    {
        store.dispatch({ type : 'autopost' })
    }
    render()
    {
        return (
            <div>Coming Soon !</div>
        )
    }
}

class Analytics extends React.Component {

    constructor(props)
    {
        super(props);
        this.state = {
            dataDay : [],
            loading: true
        }
    }

    componentWillMount()
    {
        store.dispatch({ type : 'analytics' })
    }

    getAnalytics = async () => {
        let call = await fetch(home+'/api/fetch/analytics');
        try {
            let dataDay = await call.json();
            if(dataDay)
                this.setState({ dataDay });
        } catch(e)
        {
            console.log(e);
        }
    }

    async componentDidMount()
    {
        await this.getAnalytics();
        const socket = io(home)
        socket.on('analytics', async () => {
            await this.getAnalytics();
        })
    }

    render()
    {
        const x = new Date();
        const t = new Date(x-86400000);
        const tp = new Date(x-86400000*2);
        let tdate = "0", tmonth = "0", tpdate = "0", tpmonth = "0";
        if(t.getDate() > 9)
            tdate = t.getDate();
        else
            tdate += t.getDate();
        if(tp.getDate() > 9)
            tpdate = tp.getDate();
        else
            tpdate += tp.getDate();
        if(t.getMonth() > 8)
            tmonth = t.getMonth()+1;
        else
            tmonth += t.getMonth()+1;
        if(tp.getMonth() > 8)
            tpmonth = tp.getMonth()+1;
        else
            tpmonth += tp.getMonth()+1;
        return (
            <div>

                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th scope="col">Account</th>
                            <th scope="col">ASIN</th>
                            <th scope="col">Người Xem</th>
                            <th scope="col">Lượt Xem</th>
                            <th scope="col">Lượt Mua</th>
                            <th scope="col">Doanh Thu</th>
                            <th scope="col">Giá Nguồn</th>
                            <th scope="col">Time</th>
                            <th scope="col">Profit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            this.state.dataDay.map((value, i) => 
                            <tr key={i}>
                                <td>{value.account}</td>
                                <td>{value.asin}</td>
                                <td>{value.watch}</td>
                                <td>{value.views}</td>
                                <td>{value.luot_mua}</td>
                                <td>USD ${value.doanh_thu}</td>
                                <td>USD ${value.gia_nguon}</td>
                                <td>{value.time}</td>
                                <td>{Math.round((((value.doanh_thu/value.luot_mua)*85/100-value.gia_nguon)/value.gia_nguon)*10000)/100 >= 100 ? 
                                <span className="color_green">{Math.round((((value.doanh_thu/value.luot_mua)*85/100-value.gia_nguon)/value.gia_nguon)*10000)/100}%</span>
                                :
                                <span className="color_red">{Math.round((((value.doanh_thu/value.luot_mua)*85/100-value.gia_nguon)/value.gia_nguon)*10000)/100}%</span>
                                }
                                </td>
                            </tr>
                            )
                        }
                    </tbody>
                </table>
                <a href={'javascript:PopupCenter("https://sellercentral.amazon.com/gp/site-metrics/report.html#&cols=/c0/c1/c2/c3/c4/c5/c6/c7/c8/c9/c10/c11/c12&sortColumn=13&filterFromDate='+tpmonth+'/'+tpdate+'/'+tp.getFullYear()+'&filterToDate='+tmonth+'/'+tdate+'/'+t.getFullYear()+'&fromDate='+tpmonth+'/'+tpdate+'/'+tp.getFullYear()+'&toDate='+tmonth+'/'+tdate+'/'+t.getFullYear()+'&reportID=102:DetailSalesTrafficBySKU&sortIsAscending=0&currentPage=0&dateUnit=1&viewDateUnits=ALL&runDate=", "Update Time", 400, 400)'} className="btn btn-secondary mx-0"><i className="fal fa-sync fa-fw"></i> Đồng Bộ Ngày { tmonth+' / '+tdate+' / '+t.getFullYear() }</a>
                <div className="mt-4">Hãy login vào account amazon cần đồng bộ<br/>
                Hãy chắc chắn bạn đã cài Aliv Extension</div>
            </div>
        )
    }
}

class Product extends React.Component {
    constructor(props)
    {
        super(props);
        this.state = {
            getProductList : [],
            notice : null,
            activeId : null,
            sortdown : false
        }
        this.asin = React.createRef();
        this.aliexpress = React.createRef();
        this.giaMin = React.createRef();
        this.giaBB = React.createRef();
        this.giaList = React.createRef();
        this.giaNguon = React.createRef();

        this.asinEdit = React.createRef();
        this.aliexpressEdit = React.createRef();
        this.giaMinEdit = React.createRef();
        this.giaBBEdit = React.createRef();
        this.giaListEdit = React.createRef();
        this.giaNguonEdit = React.createRef();
        this.idEdit = React.createRef();
    }

    getProductList = async () => {
        let call = await fetch(home+'/api/fetch/product');
        let getProductList = await call.json();
        this.setState({
            getProductList
        })
    }

    componentWillMount()
    {
        store.dispatch({ type: 'product' });
    }

    async componentDidMount()
    {
        await this.getProductList();
        console.log('did mount');
    }

    updateTime = () => {
        this.setState({ activeId : null });
        const socket = io(home);
        socket.on('product', (product) => {
            this.getProductList()
            this.setState({ activeId : product.id });
        });
    }

    handleEdit = async (e) => {
        e.preventDefault();
        this.asinEdit.current.blur();
        this.aliexpressEdit.current.blur();
        this.giaMinEdit.current.blur();
        this.giaBBEdit.current.blur();
        this.giaListEdit.current.blur();
        this.giaNguonEdit.current.blur();
        let call = await fetch(home+'/api/update/product', {
            method: "POST",
            headers: {
                'Content-Type' : 'application/json',
            },
            body : JSON.stringify({
                asin : this.asinEdit.current.value,
                aliexpress : this.aliexpressEdit.current.value,
                giaNguon : this.giaNguonEdit.current.value,
                giaMin : this.giaMinEdit.current.value,
                giaBB : this.giaBBEdit.current.value,
                giaList : this.giaListEdit.current.value,
                id : this.idEdit.current.value
            })
        });

        let res = await call.json();
        if (res.error)
        {
            this.setState({
                notice : <div className="alert alert-danger">ASIN bị trùng !</div>
            })
        } else {
            this.setState({
                notice : <div className="alert alert-success">Sửa thành công !</div>,
                activeId : this.idEdit.current.value
            })
            if(this.asinEdit.current.value === '')
            {
                document.querySelector('#editProduct .close').click();
                store.dispatch({ type: 'updateTke' });
            }
            this.getProductList();
        }
    }

    addNew = async (e) => {
        e.preventDefault();

        this.asin.current.blur();
        this.aliexpress.current.blur();
        this.giaMin.current.blur();
        this.giaBB.current.blur();
        this.giaList.current.blur();
        this.giaNguon.current.blur();

        let call = await fetch(home+'/api/insert/product', {
            method: "POST",
            headers: {
                'Content-Type' : 'application/json',
            },
            body : JSON.stringify({
                asin : this.asin.current.value,
                aliexpress : this.aliexpress.current.value,
                giaNguon : this.giaNguon.current.value,
                giaMin : this.giaMin.current.value,
                giaBB : this.giaBB.current.value,
                giaList : this.giaList.current.value
            })
        });

        let res = await call.json();
        if (res.error)
        {
            this.setState({
                notice : <div className="alert alert-danger">ASIN bị trùng !</div>
            })
        } else {
            store.dispatch({ type: 'updateTke' });
            this.setState({
                notice : <div className="alert alert-success">Thêm thành công !</div>
            })
            this.getProductList();
            for (var value of document.querySelectorAll('#addnew input'))
                value.value = ''
        }
    }

    render() {
        return (
            <div className="pr-4 mt-4">
            <div className="modal fade right" id="addnew" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel"
        aria-hidden="true">
        <div className="modal-dialog modal-full-height modal-right modal-notify modal-primary" role="document">
        <div className="modal-content">
        <div className="modal-header text-center bg-primary">
        <h4 className="modal-title w-100 font-weight-bold">Thêm Sản Phẩm</h4>
        <button type="button" className="close" data-dismiss="modal" aria-label="Close">
        <span aria-hidden="true">&times;</span>
        </button>
        </div>
        <div className="modal-body mx-3">
        <form onSubmit={this.addNew}>
        { this.state.notice && this.state.notice }
        <div className="form-group">
            <label>ASIN</label>
            <input ref={this.asin} type="text" className="form-control" required />
        </div>
        <div className="form-group">
            <label>Aliexpress Link</label>
            <input ref={this.aliexpress} type="url" className="form-control" required />
            <small>Bạn cần nhập đúng Link sản phẩm, nếu nhập sai sẽ không lấy được Giá Nguồn</small>
        </div>
        <div className="form-group">
            <label>Giá Nguồn</label>
            <input ref={this.giaNguon} type="number" step="0.01" className="form-control" required defaultValue="0" />
        </div>
        <div className="form-group">
            <label>Giá Min</label>
            <input ref={this.giaMin} type="number" step="0.01" className="form-control" required  defaultValue="0" />
        </div>
        <div className="form-group">
            <label>Giá BB</label>
            <input ref={this.giaBB} type="number" step="0.01" className="form-control" required  defaultValue="0" />
        </div>
        <div className="form-group">
            <label>Giá List</label>
            <input ref={this.giaList} type="number" step="0.01" className="form-control" required  defaultValue="0" />
        </div>
        <center><button type="submit" className="btn btn-submit btn-danger mt-4"><i className="fal fa-plus-circle fa-fw"></i> Thêm mới</button>
        </center>
        </form>
        </div>
        </div>
        </div>
        </div>
        <div className="modal fade right" id="editProduct" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel"
        aria-hidden="true">
        <div className="modal-dialog modal-full-height modal-right modal-notify modal-success" role="document">
        <div className="modal-content">
        <div className="modal-header text-center">
        <h4 className="modal-title w-100 font-weight-bold">Sửa Dữ Liệu</h4>
        <button type="button" className="close" data-dismiss="modal" aria-label="Close">
        <span aria-hidden="true">&times;</span>
        </button>
        </div>
        <div className="modal-body mx-3">
        <form onSubmit={this.handleEdit}>
        { this.state.notice && this.state.notice }
        <div className="form-group">
            <label>ASIN</label>
            <input ref={this.asinEdit} type="text" className="form-control" />
            <small className="mt-3">Bỏ trống mã ASIN rồi nhấn hoàn tất để xóa sản phẩm</small>
        </div>
        <div className="form-group">
            <label>Aliexpress Link</label>
            <input ref={this.aliexpressEdit} type="url" className="form-control" required />
            <small>Bạn cần nhập đúng Link sản phẩm, nếu nhập sai sẽ không lấy được Giá Nguồn</small>
        </div>
        <div className="form-group">
            <label>Giá Nguồn</label>
            <input ref={this.giaNguonEdit} type="number" step="0.01" className="form-control" required />
        </div>
        <div className="form-group">
            <label>Giá Min</label>
            <input ref={this.giaMinEdit} type="number" step="0.01" className="form-control" required />
        </div>
        <div className="form-group">
            <label>Giá BB</label>
            <input ref={this.giaBBEdit} type="number" step="0.01" className="form-control" required />
        </div>
        <div className="form-group">
            <label>Giá List</label>
            <input ref={this.giaListEdit} type="number" step="0.01" className="form-control" required />
        </div>
        <input ref={this.idEdit} type="hidden" required />
        <center><button type="submit" className="btn btn-submit btn-danger mt-4"><i className="fal fa-plus-circle fa-fw"></i> Hoàn tất</button>
        </center>
        </form>
        </div>
        </div>
        </div>
        </div>
                <table className="table  table-striped">
                    <thead>
                        <tr>
                        <th scope="col">Account</th>
                        <th scope="col">ASIN</th>
                        <th scope="col">Giá Nguồn</th>
                        <th scope="col">Giá Min</th>
                        <th scope="col">Giá BB</th>
                        <th scope="col">Giá List</th>
                        <th style={{ cursor: 'pointer' }} scope="col" onClick={() => this.setState({ sortdown: !this.state.sortdown })}>Insert { this.state.sortdown ? <i className="fa fa-sort-down" /> : <i className="fa fa-sort-up"></i> }</th>
                        <th scope="col"></th>
                        </tr>
                    </thead>
                    <tbody>
                    { 
                        this.state.getProductList.map((value, i) => 
                            <tr key={i} className={this.state.activeId === value.id ? 'active' : null }>
                                <td>{value.account}</td>
                                <td>{value.asin}</td>
                                <td><span className="color_green">USD ${value.gia_nguon}</span>
                                <div className="shipment">{value.ship}</div>
                                <div>{ new Date(value.time+3600000*7).toUTCString() }</div></td>
                                <td>USD ${value.gia_min}</td>
                                <td>USD ${value.gia_bb}</td>
                                <td>USD ${value.gia_list}</td>
                                <td>{ (new Date(value.created_at+3600000*7).getDate())+'/'+(new Date(value.created_at+3600000*7).getMonth()+1)+'/'+(new Date(value.created_at+3600000*7).getFullYear()) }</td>
                                <td>
                                    <a href={value.link} target="_blank" real="noopener noreferer" className="text-white btn-floating btn-fb btn-sm cat1 waves-effect waves-light"><i className="fal fa-external-link fa-fw"></i></a>
                                    <a href={'javascript:PopupCenter("'+value.link+'&dev.vivoo.vn-'+value.id+'", "Update Time", 400, 400)'} onClick={this.updateTime} className="text-white btn-floating btn-slack btn-sm cat1 waves-effect waves-light"><i className="fal fa-sync fa-fw"></i></a>
                                    <a href="#!" data-target="#editProduct" data-toggle="modal" 
                                    onClick={() => { 
                                        this.setState({ notice : null });
                                        document.querySelectorAll('#editProduct input')[0].value = value.asin;
                                        document.querySelectorAll('#editProduct input')[1].value = value.link;
                                        document.querySelectorAll('#editProduct input')[2].value = value.gia_nguon;
                                        document.querySelectorAll('#editProduct input')[3].value = value.gia_min;
                                        document.querySelectorAll('#editProduct input')[4].value = value.gia_bb;
                                        document.querySelectorAll('#editProduct input')[5].value = value.gia_list;
                                        document.querySelectorAll('#editProduct input')[6].value = value.id;
                                    }} 
                                    className="text-white btn-floating btn-li btn-sm cat1 waves-effect waves-light"><i className="fal fa-edit fa-fw"></i></a>
                                    <a href="#!" data-target="#editProduct" data-toggle="modal" 
                                    onClick={() => { 
                                        this.setState({ notice : null });
                                        document.querySelectorAll('#editProduct input')[0].value = '';
                                        document.querySelectorAll('#editProduct input')[1].value = value.link;
                                        document.querySelectorAll('#editProduct input')[2].value = value.gia_nguon;
                                        document.querySelectorAll('#editProduct input')[3].value = value.gia_min;
                                        document.querySelectorAll('#editProduct input')[4].value = value.gia_bb;
                                        document.querySelectorAll('#editProduct input')[5].value = value.gia_list;
                                        document.querySelectorAll('#editProduct input')[6].value = value.id;
                                    }} 
                                    className="text-white btn-floating btn-yt btn-sm cat1 waves-effect waves-light"><i className="fal fa-trash fa-fw"></i></a>
                                </td>
                            </tr>
                        )
                    }
                    </tbody>
                </table>
                <div className="row">
                <div className="col pr-1"><button onClick={() => this.setState({ notice : null })} data-target="#addnew" data-toggle="modal" className="mx-0 btn btn-light w-100"><i className="fal fa-plus-circle fa-fw"></i> Thêm mới</button></div>
                <div className="col pl-1"><button disabled onClick={() => this.setState({ notice : null })} data-target="#upload" data-toggle="modal" className="mx-0 btn btn-success w-100"><i className="fas fa-file-excel fa-fw"></i> Đồng bộ từ Excel</button></div>
                </div>
            </div>
        )
    }
}

class Tracking extends React.Component {
    
    constructor(props)
    {
        super(props);
        this.state = {
            getTrackingList : [],
            exist : false,
            editId : null,
            editAmz : null,
            editAli : null,
            currentID : null
        }
        this.amazon = React.createRef();
        this.aliexpress = React.createRef();
        this.amazonEdit = React.createRef();
        this.aliexpressEdit = React.createRef();
    }

    addNew = async (e) => {
        e.preventDefault();
        this.setState({
            exist: false
        })
        this.amazon.current.blur();
        this.aliexpress.current.blur();
        let call = await fetch(home+'/api/insert/tracking', {
            method : "POST",
            headers : {
                'Content-Type' : 'application/json'
            },
            body : JSON.stringify({
                amazon : this.amazon.current.value,
                aliexpress : this.aliexpress.current.value
            })
        });
        let res = await call.json();
        if(!res.oke)
        {
            this.setState({
                exist: true
            })
        } else { 
            this.setState({ currentID: res.oke })
            store.dispatch({ type: 'updateTke' });
            this.amazon.current.value = '';
            this.aliexpress.current.value = '';
            this.getTrackingList();
        }
    }

    handleEdit = async (e) => {
        e.preventDefault();
        this.setState({
            exist: false
        })
        this.amazon.current.blur();
        this.aliexpress.current.blur();
        let call = await fetch(home+'/api/update/tracking', {
            method : "POST",
            headers : {
                'Content-Type' : 'application/json'
            },
            body : JSON.stringify({
                id : this.state.editId,
                amazon : this.amazonEdit.current.value,
                aliexpress : this.aliexpressEdit.current.value
            })
        });
        let res = await call.json();
        if(!res.oke)
        {
            this.setState({
                exist: true
            })
        } else {
            this.setState({ currentID: res.oke })
            store.dispatch({ type: 'updateTke' });
            document.querySelector('#editProduct .close').click();
            this.getTrackingList();
        }
    }

    getTrackingList = async () => {
        let call = await fetch(home+'/api/fetch/tracking');
        let getTrackingList = await call.json();
        this.setState({
            getTrackingList
        })
        console.log(this.state.currentID);
    }
    
    getTracking = () => {
        this.setState({ currentID: null });
        const socket = io(home);
        socket.on('tracking', (tracking) => {
            this.setState({ currentID: tracking.id });
            this.getTrackingList();
        });
    }

    reconfirmTracking = () => {
        const socket = io(home);
        socket.on('reconfirmTracking', (tracking) => {
            this.setState({ currentID: tracking.id });
            this.getTrackingList();
        });
    }

    componentWillMount()
    {
        store.dispatch({ type: 'tracking' });
        
    }

    async componentDidMount(){
        await this.getTrackingList();
        console.log('did mount');
    }

    render()
    {
        return (
        <div className="pr-4 mt-4">
        <div className="modal fade right" id="addnew" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel"
        aria-hidden="true">
        <div className="modal-dialog modal-full-height modal-right modal-notify modal-primary" role="document">
        <div className="modal-content">
        <div className="modal-header text-center bg-primary">
        <h4 className="modal-title w-100 font-weight-bold">Thêm Dữ Liệu</h4>
        <button type="button" className="close" data-dismiss="modal" aria-label="Close">
        <span aria-hidden="true">&times;</span>
        </button>
        </div>
        <div className="modal-body mx-3">
        <form onSubmit={this.addNew}>
        { this.state.exist ? <div className="alert alert-danger"> Dữ liệu đã có trên hệ thống !</div> : null }
        <div className="form-group">
            <label>Amazon Order ID (*)</label>
            <input ref={this.amazon} type="text" className="form-control" required />
        </div>
        <div className="form-group">
            <label>Aliexpress Order ID (*)</label>
            <input ref={this.aliexpress} type="text" className="form-control" required />
        </div>
        <center><button type="submit" className="btn btn-submit btn-danger mt-4"><i className="fal fa-plus-circle fa-fw"></i> Thêm mới</button>
        </center>
        </form>
        </div>
        </div>
        </div>
        </div>
        <div className="modal fade right" id="editProduct" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel"
        aria-hidden="true">
        <div className="modal-dialog modal-full-height modal-right modal-notify modal-success" role="document">
        <div className="modal-content">
        <div className="modal-header text-center">
        <h4 className="modal-title w-100 font-weight-bold">Sửa Dữ Liệu</h4>
        <button type="button" className="close" data-dismiss="modal" aria-label="Close">
        <span aria-hidden="true">&times;</span>
        </button>
        </div>
        <div className="modal-body mx-3">
        <form onSubmit={this.handleEdit}>
        { this.state.exist ? <div className="alert alert-danger"> Dữ liệu đã có trên hệ thống !</div> : null }
        <div className="form-group">
            <label>Amazon Order ID</label>
            <input ref={this.amazonEdit} type="text" className="form-control" defaultValue={this.state.editAmz} />
        </div>
        <div className="form-group">
            <label>Aliexpress Order ID</label>
            <input ref={this.aliexpressEdit} type="text" className="form-control" defaultValue={this.state.editAli} />
        </div>
        <p>(*) Bỏ trống cả 2 trường để xóa dữ liệu</p>
        <center><button type="submit" className="btn btn-submit btn-danger mt-4"><i className="fal fa-plus-circle fa-fw"></i> Hoàn tất</button>
        </center>
        </form>
        </div>
        </div>
        </div>
        </div>
        <div>
            <div className="notify" style={{background: '#212121d6', zoom: 1.9, position: 'fixed', zIndex: 1000, left: 0, top: -50, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', flexDirection: 'column'}}>
  <div className="swal2-icon swal2-success swal2-animate-success-icon">
    <div className="swal2-success-circular-line-left" style={{backgroundColor: 'rgba(0, 0, 0, 0)'}} />
    <span className="swal2-success-line-tip" />
    <span className="swal2-success-line-long" />
    <div className="swal2-success-ring" /> 
    <div className="swal2-success-fix" style={{backgroundColor: 'rgba(0, 0, 0, 0)'}} />
    <div className="swal2-success-circular-line-right" style={{backgroundColor: 'rgba(0, 0, 0, 0)'}} />
  </div>
  
</div></div>

                <table className="table">
                    <thead>
                        <tr>
                        <th scope="col">Account</th>
                        <th scope="col">Amazon Order ID</th>
                        <th scope="col">Aliexpress Order ID</th>
                        <th scope="col">Tracking Number</th>
                        <th scope="col">Reconfirm Tracking</th>
                        <th scope="col">Tracking Update</th>
                        <th scope="col" className="text-center">
                            <button disabled title="get tracking auto" className="btn btn-outline-secondary m-0 mr-2 p-1"><i className="fal fa-sync fa-fw"></i> Auto</button>
                            <button disabled title="confirm amazon auto" className="btn btn-outline-primary m-0 p-1"><i className="fab fa-amazon fa-fw"></i> Auto</button>
                        </th>
                        </tr>
                    </thead>
                    <tbody>
                    {

                        this.state.getTrackingList.map((value, i) => 

                        <tr key={i} className={this.state.currentID === value.id ? 'active' : null }>
                        <td>{ value.account }</td>
                        <td><a href={'https://sellercentral.amazon.com/orders-v3/order/'+value.amz_orderId} target="_blank" rel="noopener noreferrer">{ value.amz_orderId } <i className="fal fa-external-link"></i></a></td>
                        <td><a href={'https://trade.aliexpress.com/order_detail.htm?orderId='+value.ali_orderId} target="_blank" rel="noopener noreferrer">{ value.ali_orderId } <i className="fal fa-external-link"></i></a></td>
                        <td>{ !value.tracking ? <span className="color_red">Chưa Có</span> : <span className="color_green">{ value.tracking }</span> }</td>
                        <td>{ !value.reconfirm ? <span className="color_red">Chưa Reconfirm</span> : <span className="color_green">Đã Confirm</span> }</td>
                        <td>{ !value.tracking_update ? <span>Chưa Cập Nhật</span> : <span>{ new Date(value.tracking_update+3600000*7).toUTCString() }</span> }</td>
                        <th scope="row">
                            { !value.tracking ?
                                <a title="Get Tracking" href={'javascript:PopupCenter("https://trade.aliexpress.com/order_detail.htm?orderId='+value.ali_orderId+'&dev.vivoo.vn-'+value.id+'", "Get Tracking", 400, 400)'} onClick={this.getTracking} className="text-white btn-floating btn-slack btn-sm cat1 waves-effect waves-light"><i className="fal fa-sync fa-fw"></i></a>
                                :
                                !value.reconfirm && <a title="Reconfirm Tracking" href={'javascript:PopupCenter("https://sellercentral.amazon.com/orders-v3/order/'+value.amz_orderId+'/&dev.vivoo.vn-'+value.id+'-'+value.tracking+'", "Reconfirm Tracking", 400, 400)'} onClick={this.reconfirmTracking} className="text-white btn-floating btn-slack btn-sm cat1 waves-effect waves-light"><i className="fab fa-amazon fa-fw"></i></a>
                            }
                            <a title="Chỉnh sửa" href="#!" data-target="#editProduct" data-toggle="modal" onClick={() => { this.setState({ exist : false, editId : value.id }); document.querySelectorAll('#editProduct input')[1].value = value.ali_orderId; document.querySelectorAll('#editProduct input')[0].value = value.amz_orderId; }} className="text-white btn-floating btn-li btn-sm cat1 waves-effect waves-light"><i className="fal fa-edit fa-fw"></i></a>
                            <a title="Xóa" href="#!" data-target="#editProduct" data-toggle="modal" onClick={() => { this.setState({ exist : false, editId : value.id });  document.querySelectorAll('#editProduct input')[1].value = ''; document.querySelectorAll('#editProduct input')[0].value = ''; }} className="text-white btn-floating btn-yt btn-sm cat1 waves-effect waves-light"><i className="fal fa-trash fa-fw"></i></a>
                        </th>
                        </tr>

                        )

                    }
                    </tbody>
                    </table>
                    <div className="row">
                    <div className="col pr-1"><button onClick={() => this.setState({ notice : null })} data-target="#addnew" data-toggle="modal" className="mx-0 btn btn-light w-100"><i className="fal fa-plus-circle fa-fw"></i> Thêm mới</button></div>
                    <div className="col pl-1"><button disabled onClick={() => this.setState({ notice : null })} data-target="#upload" data-toggle="modal" className="mx-0 btn btn-success w-100"><i className="fas fa-file-excel fa-fw"></i> Đồng bộ từ Excel</button></div>
                    </div>
                    <div className="my-4">
                    <span className="color_green">Get Tracking: Cần đăng nhập vào Aliexpress chứa Aliexpress Order ID đó.</span><br/>
                    <span className="color_green">Reconfirm Tracking: Cần đăng nhập vào Amazon chứa Amazon Order ID đó.</span><br/>
                    <span className="collor_green">Reconfirm Tracking chỉ click được khi đã có Tracking Number</span><br/>
                    Thuật toán sắp xếp: chưa có tracking -> đã có tracking<br/>
                    Hãy chắc chắn bạn đã cài Aliv Extension
                    </div>
            </div>
        )
    }
}

class Profile extends React.Component {
    
    constructor(props)
    {
        super(props);
        this.state = { 
            getData : {},
            gotData : {},
            changePass : false,
            done : false,
            delete : false
        }
        this.real_name = React.createRef();
        this.username = React.createRef();
        this.old_pass = React.createRef();
        this.new_pass = React.createRef();
        this.rights = React.createRef();
    }

    checkChange = () => {
        this.setState({
            changePass : !this.state.changePass
        })
    }

    getData = async () => {
        let gotData = await getUser();
        if(this.props.match.params.user && this.state.getData.rights === 4)
            gotData = await getUser(this.props.match.params.user);
        this.setState({
            gotData
        })
    }

    saved = async (e) => {
        e.preventDefault();
        this.setState({ done: false })
        let call = await fetch(home+'/api/update/profile', {
            method: "POST",
            headers: {
                'Content-Type' : 'application/json'
            },
            body : JSON.stringify({
                real_name : this.real_name.current.value,
                old_pass : this.state.changePass ? this.old_pass.current.value : null,
                new_pass : this.state.changePass && this.new_pass.current.value,
                rights : this.state.getData.rights && this.rights.current.value,
                username : this.state.getData.rights && this.username.current.value,
                id : this.state.gotData.id
            })
        });
        let data = await call.json();
        if(data.oke)
        {
            if(this.username.current.value.trim() === '')
                this.setState({ delete: true })
            this.setState({ done: true })
        }
    }

    async componentWillMount()
    {
        store.dispatch({ type: 'profile' });
        let getData = await getUser();
        this.setState({
            getData
        })
    }

    async componentDidMount()
    {
        await this.getData();
        console.log('did mount');
    }

    render(){
        if(this.state.delete)
            return ( <Redirect to="/dashboard" /> )
        return (
            <div>
                <h2 className="my-4">Profile</h2>
                <div className="row">
                    <div className="col-4">
                        <form onSubmit={this.saved}>
                        { this.state.done && <div className="alert alert-success">Chỉnh sửa thành công !</div> }
                            <div className="form-group">
                                <label>Tên hiển thị</label>
                                <input ref={this.real_name} type="text" className="form-control" defaultValue={ this.state.gotData.real_name } />
                                </div>

                                <div className="form-group">
                                <label>Tên đăng nhập</label>
                                <input ref={this.username} type="text" disabled={ this.state.getData.rights !== 4 && 'disabled' } className="form-control" defaultValue={ this.state.gotData.username } />
                                </div>
                                
                                { this.state.getData.rights && 
                                <div className="form-group">
                                    <label>Chức Vụ</label>
                                    <select ref={this.rights} className="form-control" defaultValue={this.state.gotData.rights}>
                                        <option value="0">Nhân Viên</option>
                                        <option value="4">Quản Trị Viên</option>
                                    </select>
                                </div> }

                                <input onChange={this.checkChange} type="checkbox" id="changePass"/> <label htmlFor="changePass">Đổi mật khẩu</label>
                                {
                                this.state.changePass &&
                                <div>
                                { !(this.state.gotData.rights && this.state.gotData.username !== this.state.getData.username)  &&
                                <div className="form-group">
                                <label>Mật khẩu cũ</label>
                                <input ref={this.old_pass} type="password" className="form-control" required />
                                </div> }
                                <div className="form-group">
                                <label>Mật khẩu mới</label>
                                <input ref={this.new_pass} type="text" className="form-control" required />
                                </div>
                                </div>
                                }
                                <div><button className="btn btn-light"><i className="fal fa-check-circle fa-fw"></i> Lưu lại</button></div>
                                { this.state.getData.rights === 4 && <div className="mt-2">(*) Bỏ trống tên đăng nhập nếu muốn xóa tài khoản !</div> }
                        </form>
                    </div>
                </div>
            </div>
        )
    }
}

class Employee extends React.Component {
    
    constructor(props)
    {
        super(props);
        this.state = ({
            totalUser : 0,
            listUser : [],
            exist : false,
            getData : {}
        })
        this.timeOnline = new Date().getTime()-300000;
        this.username = React.createRef();
        this.password = React.createRef();
        this.rights = React.createRef();
        this.real_name = React.createRef();
    }

    async componentDidMount()
    {
        this.getListUser();
        let getData = await getUser();
        this.setState({ getData })
        console.log('did mount');
    }

    getListUser = async() => {
        let totalUser = await fetch(home+'/api/count/user').then((r) => r.json()).then((r) => r.result);
        let listUser = await fetch(home+'/api/fetch/user').then((r) => r.json()).then((r) => r);
        this.setState({ totalUser, listUser })
    }

    addNew = async (e) => {
        e.preventDefault();
        let call = await fetch(home+'/api/register/', {
            method: "POST",
            body: JSON.stringify({
                username : this.username.current.value,
                password : this.password.current.value,
                rights : this.rights.current.value,
                real_name : this.real_name.current.value
            }),
            headers: {
                'Content-Type': 'application/json',
            }
        });
        let data = await call.json();
        if (data.success)
        {
            store.dispatch({ type: 'updateTke' });
            this.username.current.value = '';
            this.password.current.value = '';
            this.rights.current.value = 0;
            this.real_name.current.value = '';
            this.getListUser();
            this.setState({ exist : false });
        } else {
            this.setState({ exist : true });
        }
    }

    render()
    {
        return (<div>
        <div className="modal fade right" id="addnew" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel"
        aria-hidden="true">
        <div className="modal-dialog modal-full-height modal-right modal-notify modal-success" role="document">
        <div className="modal-content">
        <div className="modal-header text-center bg-primary">
        <h4 className="modal-title w-100 font-weight-bold">Thêm Tài Khoản</h4>
        <button type="button" className="close" data-dismiss="modal" aria-label="Close">
        <span aria-hidden="true">&times;</span>
        </button>
        </div>
        <div className="modal-body mx-3">
        <form onSubmit={this.addNew}>
        { this.state.exist ? <div className="alert alert-danger"> Tên đăng nhập đã bị trùng !</div> : null }
        <div className="form-group">
            <label>Tên đăng nhập (*)</label>
            <input ref={this.username} type="text" className="form-control" required />
        </div>
        <div className="form-group">
            <label>Mật khẩu (*)</label>
            <input ref={this.password} type="text" className="form-control" required />
        </div>
        <div className="form-group">
            <label>Tên hiển thị</label>
            <input ref={this.real_name} type="text" className="form-control" placeholder="Có thể bỏ trống" />
        </div>
        <div className="form-group">
            <label>Chức Vụ</label>
            <select ref={this.rights} className="form-control">
                <option value="0">Nhân Viên</option>
                <option value="4">Quản Trị Viên</option>
            </select>
        </div>
        <center><button type="submit" name="xoatruyen" className="btn btn-submit btn-danger mt-4">Tạo tài khoản</button>
        </center>
        </form>
        </div>
        </div>
        </div>
        </div>
        <h2 className="my-4">Dashboard</h2>
        <div className="row">
            <div className="col-md-6">
                Hiện có <b id="totalUser">{ this.state.totalUser }</b> nhân viên.
                <div className="my-4 row">
                {
                    this.state.listUser.map((value, index) => 
                    <div className="flex" key={index}>
                        <div><img alt="img" className="img-rounded w75" src={ value.avatar }></img></div>
                        <div className="fill avatar"><b>{ value.real_name }</b><br/> <span className={ value.last_seen > this.timeOnline ? 'online' : 'offline' } />
                        { this.state.getData.rights === 4 && <div><Link to={ '/dashboard/profile/'+value.username} >Thông tin</Link></div> }
                        </div>
                    </div>
                    )
                }
                </div>
                <button className="btn btn-light" data-target="#addnew" data-toggle="modal"><i className="fal fa-plus-circle fa-fw" /> Thêm tài khoản</button>
            </div>
            <div className="col-md-6">
                <center className="fadeIn animated">
                    <img alt="img" src={require('./../download.png')} className="img-rounded mb-3"/><br/>
                    <h3>Aliv Extension</h3>
                    <a className="btn btn-primary mb-3" href="/exs.zip"><i className="fal fa-cloud-download fa-fw"></i> Tải Xuống</a><br/>
                    <span id="aliv_extension">Cần Phải Có Để Sử Dụng</span> 
                </center>
            </div>
        </div>
        </div>)
    }
}

export default class Dashboard extends React.Component {
  
    constructor(props)
    {
        super(props);
        this.state = {
            isUser : true,
            getData : { 'avatar' : 'https://img.icons8.com/color/2x/deadpool.png' },
            now : 'dashboard',
            user : 0,
            tracking : 0,
            product : 0
        }
    }

    selectMenu = (what) => () => {
        this.setState({
            now : what
        })
    }

    thongKe = async () => {
        let call = await fetch(home+'/api/thongke');
        let data = await call.json();
        this.setState({
            user : data.user,
            tracking : data.tracking,
            product : data.product
        })
    }

    async componentWillMount()
    {
        store.subscribe(async () => 
            {
                console.log(store.getState());
                if(this.state.now !== store.getState().currentMenu)
                    this.setState({
                        now : store.getState().currentMenu
                    })
                await this.thongKe();
            }
        )
        await this.thongKe();
    }

    async componentDidMount()
    {
        let checkLogin = await isAuth();
        let getData = await getUser();
        this.setState({
            getData,
            isUser : checkLogin,
        });
        console.log('did mount');
    }

    render(){
        return (
            <div>
            { !this.state.isUser ? <Redirect to="/" /> : 
        <Router>
            <div>
                <div className="main" ref="test">
                    <div className="sideNav">
                        <ul>
                            <li>
                            <div className="flex">
                                <div><img alt="img" className="img-rounded w50" src={ this.state.getData.avatar }></img></div>
                                <div className="fill avatar"><small>Hi, <b>{ this.state.getData.real_name }</b><br/> { this.state.getData.rights ? 'Quản trị viên' : 'Nhân viên'}</small></div>
                            </div>
                            </li>
                            <Link to="/dashboard/" onClick={ this.selectMenu('dashboard') }><li className={ this.state.now === 'dashboard' ? 'active' : null } ><i className="fal fa-user-chart fa-fw"></i> Dashboard <span className="tke">{this.state.user}</span></li></Link>
                            <Link to="/dashboard/profile" onClick={ this.selectMenu('profile') }><li className={ this.state.now === 'profile' ? 'active' : null }><i className="fal fa-user fa-fw"></i> Your profile</li></Link>
                            <Link to="/dashboard/tracking" onClick={ this.selectMenu('tracking') }><li className={ this.state.now === 'tracking' ? 'active' : null }><i className="fal fa-shopping-basket fa-fw" /> Tracking <span className="tke">{this.state.tracking}</span></li></Link>
                            <Link to="/dashboard/product" onClick={ this.selectMenu('product') }><li className={ this.state.now === 'product' ? 'active' : null }><i className="fal fa-shopping-bag fa-fw" /> Product <span className="tke">{this.state.product}</span></li></Link>
                            <Link to="/dashboard/autopost" onClick={ this.selectMenu('autopost') }><li className={ this.state.now === 'autopost' ? 'active' : null }><i className="fab fa-amazon fa-fw"></i> Auto Amazon</li></Link>
                            <Link to="/dashboard/analytics" onClick={ this.selectMenu('analytics') }><li className={ this.state.now === 'analytics' ? 'active' : null }><i className="fal fa-chart-line fa-fw"></i> Analytics</li></Link>
                            <a href="//vivoo.vn" target="_blank" rel="noopener noreferer"><li><i className="fab fa-vuejs fa-fw"></i> Vivoo</li></a>
                            <a href="/logout"><li><i className="fal fa-sign-out fa-fw"></i> Logout</li></a>
                        </ul>
                    </div>
                    <div className="content">
                        <Route exact path="/dashboard/" component={Employee} />
                        <Route exact path="/dashboard/tracking" component={Tracking} />
                        <Route exact path="/dashboard/product" component={Product} />
                        <Route exact path="/dashboard/analytics" component={Analytics} />
                        <Route exact path="/dashboard/autopost" component={AutoPost} />
                        <Route exact component={Profile} path="/dashboard/profile/:user?" />
                    </div>
                </div>
                
            </div>
        </Router> }
        </div>
        )
    }
  
}