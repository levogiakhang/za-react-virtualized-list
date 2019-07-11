import React from 'react';
import './css/DemoList.css';
import CellMeasurerCache from "../CellMeasurer/CellMeasurerCache";
import Masonry from "../Masonry/Masonry";
import { fakeData } from "../utils/FakeData";
import { ListMessageExample } from "../utils/ListMessageExample";
import MasonryViewModel from "../ViewModel/MasonryViewModel";
import MessageModel from "../Model/MessageModel";
import Message from "../Message/Message";

const DATA_NUMBER = 10;

class DemoList extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      moreIndex: 0,
    };

    this.loadTopCount = 2;
    this.loadBottomCount = 2;

    this.fakeDataList = this._fakeDataList();
    this.fakeDataListTwo = this._fakeDataList();
    this.itemCount = DATA_NUMBER;
    this._cache = new CellMeasurerCache({
      defaultHeight: 150,
    });

    this.handleChangeIndex = this.handleChangeIndex.bind(this);
    this.loadMoreTop = this.loadMoreTop.bind(this);
    this.loadMoreBottom = this.loadMoreBottom.bind(this);
    this.loadMoreTopTwo = this.loadMoreTopTwo.bind(this);
    this.loadMoreBottomTwo = this.loadMoreBottomTwo.bind(this);
    this.onAddItem = this.onAddItem.bind(this);
    this.onAddItemTwo = this.onAddItemTwo.bind(this);
    DemoList.cellRendererVirtualized = DemoList.cellRendererVirtualized.bind(this);
  }

  componentDidMount(): void {
    this.masonry = React.createRef();
    this.masonryTwo = React.createRef();
    this.viewModelVirtualized = new MasonryViewModel({
      data: this.fakeDataList,
      masonry: this.masonry,
      cellCache: this._cache
    });
    this.viewModel = new MasonryViewModel({
      data: this.fakeDataListTwo,
      masonry: this.masonryTwo,
      cellCache: this._cache
    });
     this.viewModelVirtualized.onLoadMoreTop(this.loadMoreTop);
     this.viewModelVirtualized.onLoadMoreBottom(this.loadMoreBottom);
    // this.viewModel.onLoadMoreTop(this.loadMoreTopTwo);
    // this.viewModel.onLoadMoreBottom(this.loadMoreBottomTwo);
    this.setState({isLoading: false});
  }

  _fakeDataList() {
    let _fakeDataList = [];
    for (let i = 0; i < DATA_NUMBER; i++) {
      _fakeDataList.push(this._randomItem(i));
    }
    return _fakeDataList;
  }

  handleChangeIndex(e) {
    if (this._isInRange(e.target.value, 0, this.fakeDataList.length)) {
      this.setState({moreIndex: e.target.value});
    } else {
      alert('OUT OF RANGE');
    }
  };

  loadMoreTop() {
    if (this.loadTopCount > 0) {
      const res = this._generateMoreItems(10);
      for (let i = 0; i < res.length; i++) {
        this.viewModelVirtualized.addTop(res[i]);
      }
      this.loadTopCount--;
    }
  }

  loadMoreTopTwo() {
    if (this.loadTopCount > 0) {
      const res = this._generateMoreItems(10);
      for (let i = 0; i < res.length; i++) {
        this.viewModel.addTop(res[i]);
      }
      this.loadTopCount--;
    }
  }

  loadMoreBottom() {
    if (this.loadBottomCount > 0) {
      const res = this._generateMoreItems(10, false);
      for (let i = 0; i < res.length; i++) {
        this.viewModelVirtualized.addBottom(res[i]);
      }
      this.loadBottomCount--;
    }
  }

  loadMoreBottomTwo() {
    if (this.loadBottomCount > 0) {
      const res = this._generateMoreItems(10, false);
      for (let i = 0; i < res.length; i++) {
        this.viewModel.addBottom(res[i]);
      }
      this.loadBottomCount--;
    }
  }

  onAddItem() {
    const {moreIndex} = this.state;
    const item = this._randomItem(this.itemCount);
    this.itemCount++;
    if (this._isInRange(moreIndex, 0, this.fakeDataList.length)) {
      this.viewModelVirtualized.onAddItem(moreIndex, item);
    }
  };

  onAddItemTwo() {
    const {moreIndex} = this.state;
    const item = this._randomItem(this.itemCount);
    this.itemCount++;
    if (this._isInRange(moreIndex, 0, this.fakeDataListTwo.length)) {
      this.viewModel.onAddItem(moreIndex, item);
    }
  };

  static cellRendererVirtualized({index, data, removeCallback}) {
    const mess = new MessageModel({
      id: data[index].itemId,
      userAvatarUrl: data[index].avatar,
      userName: data[index].userName,
      messageContent: data[index].msgContent,
      sentTime: data[index].timestamp,
      isMine: false,
      onRemoveItem: removeCallback,
    });
    return (
      <Message id={mess.getItemId()}
               key={mess.getItemId()}
               index={index}
               userAvatarUrl={mess.getUserAvatarUrl}
               userName={mess.getUserName}
               messageContent={mess.getMessageContent}
               sentTime={mess.getSentTime}
               isMine={mess.isMine}
               onRemoveItem={mess.onRemoveCallBack}/>
    );
  }

  static cellRender({item, index, removeCallback}) {
    const mess = new MessageModel({
      id: item.itemId,
      userAvatarUrl: item.avatar,
      userName: item.userName,
      messageContent: item.msgContent,
      sentTime: item.timestamp,
      isMine: false,
      onRemoveItem: removeCallback,
    });
    return (
      <Message id={mess.getItemId()}
               key={mess.getItemId()}
               index={index}
               userAvatarUrl={mess.getUserAvatarUrl}
               userName={mess.getUserName}
               messageContent={mess.getMessageContent}
               sentTime={mess.getSentTime}
               isMine={mess.isMine}
               onRemoveItem={mess.onRemoveCallBack}/>
    );
  }

  _isInRange = function (index: number, startIndex: number, endIndex: number): boolean {
    return index >= startIndex && index <= endIndex;
  };

  _randomItem = function (index): Object {
    const result = {...fakeData};
    result.itemId = result.itemId + index;
    result.userName = result.userName + index;
    result.msgContent = ListMessageExample[Math.floor(Math.random() * 20)];
    result.avatar = result.avatar + Math.floor(Math.random() * 99) + ".jpg";
    return result;
  };

  _generateMoreItems(num: number) {
    let arrayItems = [];
    for (let i = 0; i < num; i++) {
      arrayItems.push(this._randomItem(this.itemCount + i));
    }

    this.itemCount += num;
    return arrayItems;
  };

  _renderVLControlView = () => {
    const {moreIndex} = this.state;
    return (
      <div className={'control-view'}>
        <input className={'input-demo input-index'}
               type={'number'}
               placeholder={`Index`}
               value={moreIndex}
               onChange={this.handleChangeIndex}/>

        <button className={'btn-control btn-add'}
                onClick={this.onAddItem}>
          Add new item at
        </button>

        <button onClick={() => {
          this.viewModelVirtualized.updateData(this._fakeDataList())
        }}>refresh data
        </button>

        <div style={{display: 'flex', margin: '20px', justifyContent: 'space-around'}}>
          <button onClick={() => {
            this.viewModelVirtualized.scrollToSpecialItem('id_' + this.state.moreIndex)
          }}> Scroll To
          </button>

          <button onClick={() => {
            this.viewModelVirtualized.scrollToTop()
          }}> Scroll Top
          </button>

          <button onClick={() => {
            this.viewModelVirtualized.scrollToBottom()
          }}> Scroll Bottom
          </button>
        </div>
      </div>
    );
  };

  _renderControlView = () => {
    const {moreIndex} = this.state;
    return (
      <div className={'control-view'}>
        <input className={'input-demo input-index'}
               type={'number'}
               placeholder={`Index`}
               value={moreIndex}
               onChange={this.handleChangeIndex}/>

        <button className={'btn-control btn-add'}
                onClick={this.onAddItemTwo}>
          Add new item at
        </button>

        <div style={{display: 'flex', margin: '20px', justifyContent: 'space-around'}}>
          <button onClick={() => {
            this.viewModel.scrollToSpecialItem('id_' + this.state.moreIndex)
          }}> Scroll To
          </button>

          <button onClick={() => {
            this.viewModel.scrollToTop()
          }}> Scroll Top
          </button>

          <button onClick={() => {
            this.viewModel.scrollToBottom()
          }}> Scroll Bottom
          </button>
        </div>
      </div>
    );
  };

  _renderVirtualizedList = () => {
    return (
      <Masonry height={500}
               ref={this.masonry}
               style={{marginTop: "10px", borderRadius: '5px'}}
               id={'Masonry'}
               viewModel={this.viewModelVirtualized}
               cellRenderer={DemoList.cellRendererVirtualized}
               numOfOverscan={3}
               isVirtualized={true}
               isStartAtBottom={true}/>
    )
  };

  _renderList = () => {
    return (
      <Masonry ref={this.masonryTwo}
               style={{marginTop: "10px", borderRadius: '5px'}}
               id={'MasonryTwo'}
               viewModel={this.viewModel}
               cellRenderer={DemoList.cellRender}
               isVirtualized={false}
               isStartAtBottom={true}/>
    )
  };

  render() {
    const {isLoading} = this.state;
    return (
      isLoading ?
        <div>Loading...</div>
        :
        <div className={'container'}>
          <div style={{display: 'flex', justifyContent: 'space-around'}}>
            <div>
              {this._renderVLControlView()}
              {this._renderVirtualizedList()}
            </div>
            <div>
              {this._renderControlView()}
              {/*{this._renderList()}*/}
            </div>
          </div>
        </div>
    );
  }
}

export default DemoList;
