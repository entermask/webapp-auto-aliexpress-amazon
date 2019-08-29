import React from 'react'
import home, { isAuth, getUser } from '../config'
import { Redirect, Link, Route, BrowserRouter as Router } from 'react-router-dom'
import './../res/css/dashboard.css';
import io from 'socket.io-client';
import { createStore, combineReducers  } from 'redux'
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import DataTable from 'react-data-table-component';
import 'react-toastify/dist/ReactToastify.css';
import ReactTooltip from 'react-tooltip'

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
            socket.disconnect(0);
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
            sortdown : false,
            auto : false,
            demAmazon : 0,
            file : null,
            uploadDisabled : true,
            uploadPercent : 0,
            status : 'chọn file excel để upload (tự động lọc trùng ASIN)'
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
        let demAmazon = 0;
        for(let value of getProductList)
        {
            if(!value.posted)
                demAmazon++;
        }
        this.setState({
            getProductList,
            demAmazon
        })
        if(this.state.auto)
        {
            setTimeout(function(){
                if(document.querySelector('a[title="Post lên Amazon"]'))
                    document.querySelector('a[title="Post lên Amazon"]').click();
            },200)
        }
    }

    componentWillMount()
    {
        store.dispatch({ type: 'product' });
    }

    async componentDidMount()
    {
        await this.getProductList();
        console.log('call mount');
    }

    receiveUploaded = async () => {
        const socket = io(home);
        console.log('call me');
        socket.on('uploadedProduct', (product) => {
            this.getProductList();
            toast.success('Đã upload !');
            socket.disconnect(0);
        });
    }

    updateTime = () => {
        this.setState({ activeId : null });
        const socket = io(home);
        socket.on('product', (product) => {
            this.getProductList();
            this.setState({ activeId : product.id });
            toast.success(<span><i className="fa fa-check-circle fa-fw"></i> Get Giá Nguồn thành công !</span>);
            socket.disconnect(0);
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
            toast.error(<span><i className="fa fa-times-circle fa-fw"></i> ASIN bị trùng !</span>)
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
                toast.success(<span><i className="fa fa-check-circle fa-fw"></i> Xóa thành công !</span>)
                document.querySelector('#editProduct .close').click();
                store.dispatch({ type: 'updateTke' });
            } else
                toast.success(<span><i className="fa fa-check-circle fa-fw"></i> Sửa thành công !</span>)
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
            toast.error(<span><i className="fa fa-times-circle fa-fw"></i> ASIN bị trùng !</span>)
            this.setState({
                notice : <div className="alert alert-danger">ASIN bị trùng !</div>
            })
        } else {
            store.dispatch({ type: 'updateTke' });
            toast.success(<span><i className="fa fa-check-circle fa-fw"></i> Thêm thành công !</span>)
            this.setState({
                notice : <div className="alert alert-success">Thêm thành công !</div>
            })
            this.getProductList();
            for (var value of document.querySelectorAll('#addnew input'))
                value.value = ''
        }
    }

    chooseFile = e => {
        this.setState({
            uploadDisabled : false,
            file : e.target.files[0],
            status : 'sẵn sàng để upload'
        });
        console.log(e.target.files[0])
    }

    uploadFile = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('excel', this.state.file);
        this.setState({
            uploadDisabled: true,
            status: 'đang upload (reload để cancel)'
        });
        let call = await axios.post(home+'/api/upload/product', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: e => {
                this.setState({
                    uploadPercent: parseInt(Math.round((e.loaded*100)/e.total))
                })
            }
        });
        toast.success(<span><i className="fa fa-check-circle fa-fw"/> Upload File thành công !</span>)
        this.setState({
            uploadDisabled: false,
            status: <font color="green">upload thành công !</font>
        })
        document.querySelector('input[type=file]').value = '';
        this.getProductList();
    }

    render() {
        const columns = [
            {
              name: 'Account',
              selector: 'account',
              sortable: true,
              grow: 0.5
            },
            {
              name: 'Uploaded ASIN',
              selector: 'posted',
              sortable: true,
              format: i => <span>{ i.asin }<br /> { i.posted ? <span className="color_green">Đã Upload</span> : <span className="color_red">Chờ Upload</span> }</span>
            },
            {
              name: 'Giá Nguồn',
              selector: 'gia_nguon',
              format: value => (<div><span className="color_green">USD ${value.gia_nguon}</span>
              <div className="shipment">{value.ship}</div>
              <div>{ new Date(value.time+3600000*7).toUTCString() }</div></div>),
              grow: 1.5
            },
            {
              name: 'Giá Min',
              selector: 'gia_min',
              format: i => <span>{ i.gia_min } $</span>,
              grow: 0.5
            },
            {
                name: 'Giá BB',
                selector: 'gia_bb',
                format: i => <span>{ i.gia_bb } $</span>,
                grow: 0.5
            },
            {
                name: 'Giá List',
                selector: 'gia_list',
                format: i => <span>{ i.gia_list } $</span>,
                grow: 0.5
            },
            {
                name: 'Ngày Tạo',
                selector: 'created_at',
                sortable: true,
                grow: 0.5,
                format: value => (new Date(value.created_at+3600000*7).getDate())+'/'+(new Date(value.created_at+3600000*7).getMonth()+1)+'/'+(new Date(value.created_at+3600000*7).getFullYear())
            },
            {
                selector: 'tool',
                right: true,
                grow: 2,
                format: value => (<div>
                { !value.posted && <a onClick={this.receiveUploaded} title="Post lên Amazon" href={'javascript:PopupCenter("https://sellercentral.amazon.com/abis/listing/syh?asin='+value.asin+'&ref_=xx_catadd_dnav_xx&dev.vivoo.vn-'+value.id+','+value.gia_list+'", "Update Time", 400, 400)'} className="text-white btn-floating bg-warning btn-sm cat1 waves-effect waves-light"><i className="fab fa-amazon fa-fw"></i></a> }
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
                className="text-white btn-floating btn-yt btn-sm cat1 waves-effect waves-light"><i className="fal fa-trash fa-fw"></i></a></div>)
            }
          ];
        
        return (
        <div>
        
        <div className="mt-4 pl-3" style={{ fontSize: '1.5rem' }}>
        <i onClick={() => this.setState({ notice : null })} data-target="#addnew" data-toggle="modal" className="fal fa-plus-square mr-5 tool" data-tip="Thêm bản ghi"></i>
        <i onClick={() => this.setState({ notice : null })} data-target="#upload" data-toggle="modal" className="fal fa-file-excel mr-5 tool" data-tip="Đồng bộ Excel"></i>
        <i onClick={() => this.setState({ notice : null })} data-target="#autoAmazon" data-toggle="modal" className="fab fa-amazon mr-5 tool" data-tip="Auto Post Amazon"></i>
        <i className="fal fa-question mr- 5" data-tip data-for="global"></i>
        </div>
        <hr/>
        <ReactTooltip place="bottom" type="dark" effect="solid"/>
        <ReactTooltip id='global' aria-haspopup='true' role='example'>
            1. Hãy chắc chắn đã cài Aliv Extension mới nhất<br/>
            2. Di chuột vào tên bảng để hiện sort (Account, Ngày tạo, Uploaded ASIN)
        </ReactTooltip>
        
        <ToastContainer 
        position="top-center"
        newestOnTop />

        <div className="modal fade" id="autoAmazon" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle"
        aria-hidden="true">

        <div className="modal-dialog modal-dialog-centered" role="document" style={{ color: '#333' }}>
            <div className="modal-content">
            <div className="modal-header">
                <h5 className="modal-title" id="exampleModalLongTitle" style={{ color: 'blue' }}>Auto Upload Amazon</h5>
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div className="modal-body">
                { this.state.demAmazon > 0 && <span><i className={ !this.state.auto ? 'fal fa-clock fa-fw' : 'fa fa-spin fa-spinner fa-pulse'} /> Hàng chờ còn lại:</span> }
                <b style={{ display: 'block', fontSize: '3.5rem', color: '#33b5e5', textAlign: 'center', fontWeight: 800 }}>{this.state.demAmazon}</b>
                <center>{ this.state.demAmazon > 0 && 
                <div>
                    <span><i className="fal fa-clock fa-fw" /> Ước tính: <b>{ 7*this.state.demAmazon } giây</b></span>                    
                { !this.state.auto ?
                        <div><button className="btn btn-success" onClick={() => { this.setState({ auto: true }); if(document.querySelector('a[title="Post lên Amazon"]')) document.querySelectorAll('a[title="Post lên Amazon"]')[0].click(); }}>BẬT AUTO </button></div>
                    :
                    <div><button className="btn btn-danger" onClick={() => { this.setState({ auto: false }); }}> TẮT AUTO </button></div>
                }
                </div> }</center>
            </div>
            </div>
        </div>
        </div>


        <div className="modal fade bottom" id="upload" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle"
        aria-hidden="true">

        <div className="modal-dialog modal-frame modal-bottom modal-notify modal-success" role="document" style={{ color: '#333' }}>
            <div className="modal-content">
            <div className="modal-body">
               <div className="container">
                   <i className="fal fa-star fa-fw" /> Trạng thái: <b>{ this.state.status }</b>
                   <form onSubmit={this.uploadFile}>
                    { (this.state.uploadPercent === 0 || this.state.uploadPercent === 100) ? <input onChange={this.chooseFile} type="file" accept=".xlsx" name="exel" className="form-control mt-2" style={{ paddingTop: '3.5px' }} /> :  
                    <div className="progress md-progress mt-2" style={{ height: '.75rem'}}>
                        <div className="progress-bar progress-bar-striped" role="progressbar" style={{width: this.state.uploadPercent+'%', height: '.75rem'}}>{this.state.uploadPercent}%</div>
                    </div>
                    }
                    <center>
                        { this.state.uploadDisabled ? <button disabled type="submit" className="btn btn-outline-success"><i className="fal fa-cloud-upload fa-fw" /> UPLOAD</button> : <button type="submit" className="btn btn-outline-success"><i className="fal fa-cloud-upload fa-fw" /> UPLOAD</button> }
                     <button className="btn btn-outline-danger" data-dismiss="modal">ĐÓNG</button></center>
                    </form>
               </div>
            </div>
            </div>
        </div>
        </div>

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
            <input ref={this.giaNguonEdit} type="number" step="0.01" className="form-control" required />`
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
        <center><button type="submit" className="btn btn-submit btn-danger mt-4"><i className="fal fa-plus-circle fa-fw"></i> Hoàn tất</button></center>
        </form>
        </div>
        </div>
        </div>
        </div>
        <DataTable
        columns={columns}
        data={this.state.getProductList}
        striped={true}
        highlightOnHover={true}
        customTheme={{
            rows: {
                height: '64px', 
                fontSize: '.8rem'
            },
            title: {
                height: '0px'
            }
        }}
      />
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
            currentID : null,
            demAli : null,
            demAmazon: null,
            auto : false,
            file : null,
            uploadDisabled : true,
            uploadPercent : 0,
            status : 'chọn file excel để upload'
        }
        this.amazon = React.createRef();
        this.aliexpress = React.createRef();
        this.amazonAccount = React.createRef();
        this.tenKH = React.createRef();
        this.address = React.createRef();
        this.amazonAccountEdit = React.createRef();
        this.addressEdit = React.createRef();
        this.tenKHEdit = React.createRef();
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
                aliexpress : this.aliexpress.current.value,
                amazonAccount : this.amazonAccount.current.value,
                tenKH : this.tenKH.current.value,
                address : this.address.current.value
            })
        });
        let res = await call.json();
        if(!res.oke)
        {
            toast.error(<span><i className="fa fa-times-circle fa-fw"></i> Tracking bị trùng !</span>);
            this.setState({
                exist: true
            })
        } else { 
            toast.success(<span><i className="fa fa-check-circle fa-fw"/> Thêm Tracking thành công !</span>);
            store.dispatch({ type: 'updateTke' });
            this.amazon.current.value = '';
            this.aliexpress.current.value = '';
            this.amazonAccount.current.value = '';
            this.tenKH.current.value = '';
            this.address.current.value = '';
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
                aliexpress : this.aliexpressEdit.current.value,
                amazonAccount : this.amazonAccountEdit.current.value,
                tenKH : this.tenKHEdit.current.value,
                address : this.addressEdit.current.value
            })
        });
        let res = await call.json();
        if(!res.oke)
        {
            toast.error(<span><i className="fa fa-times-circle fa-fw"></i> Tracking bị trùng !</span>);
            this.setState({
                exist: true
            })
        } else {
            if(!this.amazonEdit && !this.aliexpressEdit)
                toast.success(<span><i className="fa fa-check-circle fa-fw"/> Sửa Tracking thành công !</span>)
            else
                toast.success(<span><i className="fa fa-check-circle fa-fw"/> Xóa Tracking thành công !</span>)
            store.dispatch({ type: 'updateTke' });
            document.querySelector('#editProduct .close').click();
            this.getTrackingList();
        }
    }

    getTrackingList = async () => {
        let call = await fetch(home+'/api/fetch/tracking');
        let getTrackingList = await call.json();
        let demAli = 0, demAmazon = 0;
        getTrackingList.map((value) => {
            if(!value.tracking)
                demAli++;
            else if(!value.reconfirm)
                demAmazon++;
        })
        this.setState({
            getTrackingList,
            demAli,
            demAmazon
        })
        if(this.state.auto === 'amazon')
        {
            setTimeout(function(){
                if(document.querySelector('a[title="Reconfirm Tracking"]'))
                    document.querySelector('a[title="Reconfirm Tracking"]').click();
            },200)
        }
        if(this.state.auto === 'aliexpress')
        {
            setTimeout(function(){
                if(document.querySelector('a[title="Get Tracking"]'))
                    document.querySelector('a[title="Get Tracking"]').click();
            },200)
        }
        console.log(getTrackingList);
    }
    
    getTracking = () => {
        this.setState({ currentID: null });
        const socket = io(home);
        socket.on('tracking', (tracking) => {
            toast.success(<span><i className="fa fa-check-circle fa-fw"/> Get Tracking thành công !</span>)
            this.getTrackingList();
            socket.disconnect(0);
        });
    }

    reconfirmTracking = () => {
        const socket = io(home);
        socket.on('reconfirmTracking', (tracking) => {
            toast.success(<span><i className="fa fa-check-circle fa-fw"/> Reconfirm Tracking thành công !</span>)
            this.getTrackingList();
            socket.disconnect(0);
        });
    }

    componentWillMount()
    {
        store.dispatch({ type: 'tracking' });
        
    }

    async componentDidMount(){
        await this.getTrackingList();
    }

    chooseFile = e => {
        this.setState({
            uploadDisabled : false,
            file : e.target.files[0],
            status : 'sẵn sàng để upload'
        });
        console.log(e.target.files[0])
    }

    uploadFile = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('excel', this.state.file);
        this.setState({
            uploadDisabled: true,
            status: 'đang upload (reload để cancel)'
        });
        let call = await axios.post(home+'/api/upload/tracking', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: e => {
                this.setState({
                    uploadPercent: parseInt(Math.round((e.loaded*100)/e.total))
                })
            }
        });
        toast.success(<span><i className="fa fa-check-circle fa-fw"/> Upload File thành công !</span>)
        this.setState({
            uploadDisabled: false,
            status: <font color="green">upload thành công !</font>
        })
        document.querySelector('input[type=file]').value = '';
        this.getTrackingList();
    }

    render()
    {
        const columns = [
            {
              name: 'Account',
              selector: 'account',
              sortable: true,
              format: i => <span>{ i.account }<br/> <small>amz: {i.amazon}</small></span>
            },
            {
              name: 'Amazon Order ID',
              selector: 'amz_orderId',
              format: value => <span>{ value.amz_orderId } <a href={'https://sellercentral.amazon.com/orders-v3/order/'+value.amz_orderId} target="_blank" rel="noopener noreferrer"><i className="fal fa-external-link"></i></a></span>
            },
            {
              name: 'Aliexpress Order ID',
              selector: 'ali_orderId',
              format: value => <span>{ value.ali_orderId } <a href={'https://trade.aliexpress.com/order_detail.htm?orderId='+value.ali_orderId} target="_blank" rel="noopener noreferrer"><i className="fal fa-external-link"></i></a></span>
            },
            {
              name: 'Tracking Number',
              selector: 'tracking',
              format: i => (<span>{ i.tracking ? <span className="color_green" style={{ fontSize: '1rem' }}>{ i.tracking }</span> : <span className="color_red">Chưa có</span> }<br/>
              { !i.tracking_update ? 'Chưa có' : new Date(i.tracking_update+3600000*7).toUTCString() }
              </span>),
              sortable: true,
              grow: 1.5
            },
            {
                name: 'Reconfirm',
                selector: 'reconfirm',
                sortable: true,
                format: i => ( i.reconfirm ? <span className="color_green">Đã confirm</span> : <span className="color_red">Chờ confirm</span> )
            },
            {
                name: 'Tên Khách Hàng',
                selector: 'name'
            },
            {
                name: 'Địa chỉ',
                selector: 'address'
            },
            {
                selector: 'tool',
                right: true,
                format: value => (<span>{ !value.tracking ?
                  <a title="Get Tracking" href={'javascript:PopupCenter("https://trade.aliexpress.com/order_detail.htm?orderId='+value.ali_orderId+'&dev.vivoo.vn-'+value.id+'", "Get Tracking", 400, 400)'} onClick={this.getTracking} className="text-white btn-floating btn-slack btn-sm cat1 waves-effect waves-light"><i className="fal fa-sync fa-fw"></i></a>
                  :
                  !value.reconfirm && <a title="Reconfirm Tracking" href={'javascript:PopupCenter("https://sellercentral.amazon.com/orders-v3/order/'+value.amz_orderId+'/&dev.vivoo.vn-'+value.id+'-'+value.tracking+'", "Reconfirm Tracking", 400, 400)'} onClick={this.reconfirmTracking} className="text-white btn-floating btn-slack btn-sm cat1 waves-effect waves-light"><i className="fab fa-amazon fa-fw"></i></a>
              }
              <a title="Chỉnh sửa" href="#!" data-target="#editProduct" data-toggle="modal" onClick={() => { this.setState({ exist : false, editId : value.id }); document.querySelectorAll('#editProduct input')[1].value = value.ali_orderId; document.querySelectorAll('#editProduct input')[0].value = value.amz_orderId; document.querySelectorAll('#editProduct input')[2].value = value.amazon; document.querySelectorAll('#editProduct input')[3].value = value.name; document.querySelectorAll('#editProduct textarea')[0].value = value.address; }} className="text-white btn-floating btn-li btn-sm cat1 waves-effect waves-light"><i className="fal fa-edit fa-fw"></i></a>
              <a title="Xóa" href="#!" data-target="#editProduct" data-toggle="modal" onClick={() => { this.setState({ exist : false, editId : value.id });  document.querySelectorAll('#editProduct input')[1].value = ''; document.querySelectorAll('#editProduct input')[0].value = '';  document.querySelectorAll('#editProduct input')[2].value = value.amazon; document.querySelectorAll('#editProduct input')[3].value = value.name; document.querySelectorAll('#editProduct textarea')[0].value = value.address; }} className="text-white btn-floating btn-yt btn-sm cat1 waves-effect waves-light"><i className="fal fa-trash fa-fw"></i></a></span>)
            }
          ];
        return (
        <div>
            <div className="mt-4 pl-3" style={{ fontSize: '1.5rem' }}>
            <i onClick={() => this.setState({ notice : null })} data-target="#addnew" data-toggle="modal" className="fal fa-plus-square mr-5 tool" data-tip="Thêm bản ghi"></i>
            <i onClick={() => this.setState({ notice : null })} data-target="#upload" data-toggle="modal" className="fal fa-file-excel mr-5 tool" data-tip="Đồng bộ Excel"></i>
            <i data-target="#autoAli" data-toggle="modal" className="fal fa-shopping-cart mr-5 tool" data-tip="Auto Get Tracking"></i>
            <i data-target="#autoAmazon" data-toggle="modal" className="fab fa-amazon mr-5 tool" data-tip="Auto Confirm Tracking"></i>
            <i className="fal fa-question mr-5" data-tip data-for="global"></i>
            </div>
            <hr/>
            <ReactTooltip place="bottom" type="dark" effect="solid"/>
            <ReactTooltip id='global' aria-haspopup='true' role='example'>
                1. Hãy chắc chắn đã cài Aliv Extension mới nhất<br/>
                2. Sẽ xuất hiện nút reconfirm khi đã có Tracking Number<br/>
                3. Di chuột vào tên bảng để hiện sort (Account, Tracking Number, Reconfirm)
            </ReactTooltip>
            <ToastContainer 
            position="top-center"
            newestOnTop />
        <div className="modal fade" id="autoAli" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle"
        aria-hidden="true">

        <div className="modal-dialog modal-dialog-centered" role="document" style={{ color: '#333' }}>
            <div className="modal-content">
            <div className="modal-header">
                <h5 className="modal-title" id="exampleModalLongTitle" style={{ color: 'red' }}>Aliexpress</h5>
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div className="modal-body">
                { this.state.demAli > 0 && <span><i className={ this.state.auto !== 'aliexpress' ? 'fal fa-clock fa-fw' : 'fa fa-spin fa-spinner fa-pulse'} /> Hàng chờ còn lại:</span> }
                <b style={{ display: 'block', fontSize: '3.5rem', color: '#33b5e5', textAlign: 'center', fontWeight: 800 }}>{this.state.demAli}</b>
                <center>{ this.state.demAli > 0 && 
                <div>
                    <span><i className="fal fa-clock fa-fw" /> Ước tính: <b>{ 2*this.state.demAli } giây</b></span>
                    { this.state.auto !== 'aliexpress' ?
                        <div><button className="btn btn-success" onClick={() => { this.setState({ auto: 'aliexpress' }); if(document.querySelector('a[title="Get Tracking"]')) document.querySelectorAll('a[title="Get Tracking"]')[0].click(); }}>BẬT AUTO </button></div>
                    :
                    <div><button className="btn btn-danger" onClick={() => { this.setState({ auto: null }); }}> TẮT AUTO </button></div>
                }
                </div> }</center>
                
            </div>
            </div>
        </div>
        </div>
        <div className="modal fade" id="autoAmazon" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle"
        aria-hidden="true">

        <div className="modal-dialog modal-dialog-centered" role="document" style={{ color: '#333' }}>
            <div className="modal-content">
            <div className="modal-header">
                <h5 className="modal-title" id="exampleModalLongTitle" style={{ color: 'blue' }}>Amazon</h5>
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div className="modal-body">
                { this.state.demAmazon > 0 && <span><i className={ this.state.auto !== 'amazon' ? 'fal fa-clock fa-fw' : 'fa fa-spin fa-spinner fa-pulse'} /> Hàng chờ còn lại:</span> }
                <b style={{ display: 'block', fontSize: '3.5rem', color: '#33b5e5', textAlign: 'center', fontWeight: 800 }}>{this.state.demAmazon}</b>
                <center>{ this.state.demAmazon > 0 && 
                <div>
                    <span><i className="fal fa-clock fa-fw" /> Ước tính: <b>{ 5*this.state.demAmazon } giây</b></span>                    
                { this.state.auto !== 'amazon' ?
                        <div><button className="btn btn-success" onClick={() => { this.setState({ auto: 'amazon' }); if(document.querySelector('a[title="Reconfirm Tracking"]')) document.querySelectorAll('a[title="Reconfirm Tracking"]')[0].click(); }}>BẬT AUTO </button></div>
                    :
                    <div><button className="btn btn-danger" onClick={() => { this.setState({ auto: null }); }}> TẮT AUTO </button></div>
                }
                </div> }</center>
            </div>
            </div>
        </div>
        </div>

        <div className="modal fade bottom" id="upload" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle"
        aria-hidden="true">

        <div className="modal-dialog modal-frame modal-bottom modal-notify modal-success" role="document" style={{ color: '#333' }}>
            <div className="modal-content">
            <div className="modal-body">
               <div className="container">
                   <i className="fal fa-star fa-fw" /> Trạng thái: <b>{ this.state.status }</b>
                   <form onSubmit={this.uploadFile}>
                    { (this.state.uploadPercent === 0 || this.state.uploadPercent === 100) ? <input onChange={this.chooseFile} type="file" accept=".xlsx" name="exel" className="form-control mt-2" style={{ paddingTop: '3.5px' }} /> :  
                    <div className="progress md-progress mt-2" style={{ height: '.75rem'}}>
                        <div className="progress-bar progress-bar-striped" role="progressbar" style={{width: this.state.uploadPercent+'%', height: '.75rem'}}>{this.state.uploadPercent}%</div>
                    </div>
                    }
                    <center>
                        { this.state.uploadDisabled ? <button disabled type="submit" className="btn btn-outline-secondary"><i className="fal fa-cloud-upload fa-fw" /> UPLOAD</button> : <button type="submit" className="btn btn-outline-success"><i className="fal fa-cloud-upload fa-fw" /> UPLOAD</button> }
                     <button className="btn btn-outline-danger" data-dismiss="modal">ĐÓNG</button></center>
                    </form>
               </div>
            </div>
            </div>
        </div>
        </div>

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
        <div className="form-group">
            <label>Amazon Account</label>
            <input ref={this.amazonAccount} type="text" className="form-control" />
        </div>
        <div className="form-group">
            <label>Tên khách hàng</label>
            <input ref={this.tenKH} type="text" className="form-control" />
        </div>
        <div className="form-group">
            <label>Địa chỉ</label>
            <textarea ref={this.address} type="text" className="form-control" />
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
        <div className="form-group">
            <label>Amazon Account</label>
            <input ref={this.amazonAccountEdit} type="text" className="form-control" />
        </div>
        <div className="form-group">
            <label>Tên khách hàng</label>
            <input ref={this.tenKHEdit} type="text" className="form-control" />
        </div>
        <div className="form-group">
            <label>Địa chỉ</label>
            <textarea ref={this.addressEdit} type="text" className="form-control" />
        </div>
        <p>(*) Bỏ trống cả 2 trường đầu để xóa dữ liệu</p>
        <center><button type="submit" className="btn btn-submit btn-danger mt-4"><i className="fal fa-plus-circle fa-fw"></i> Hoàn tất</button>
        </center>
        </form>
        </div>
        </div>
        </div>
        </div>
        <div>
</div>
<DataTable
        columns={columns}
        data={this.state.getTrackingList}
        striped={true}
        highlightOnHover={true}
        customTheme={{
            rows: {
                height: '64px',
                fontSize: '.8rem'
            },
            title: {
                height: '0px'
            }
        }}
      />
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
    }

    render(){
        if(this.state.delete)
            return ( <Redirect to="/dashboard" /> )
        return (
            <div className="ml-4">
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
        return (<div className="ml-4">
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