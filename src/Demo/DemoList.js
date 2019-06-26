import React from 'react';
import './css/DemoList.css';
import CellMeasurerCache from "../CellMeasurer/CellMeasurerCache";
import Masonry from "../Masonry/Masonry";
import { fakeData } from "../utils/FakeData";
import { ListMessageExample } from "../utils/ListMessageExample";

let dataList = [];

const DATA_NUMBER = 50;

class DemoList extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      moreIndex: 0,
    };

    this.isLoadTopAlready = false;
    this.isLoadBottomAlready = false;

    this.fakeDataList = this._fakeDataList();

    this._cache = new CellMeasurerCache({
      defaultHeight: 200,
      height: 270,
    });
  }

  componentDidMount(): void {
    this.setState({ isLoading: false });
  }

  async getData() {
    return fetch('https://randomuser.me/api/?results=' + DATA_NUMBER)
      .then(response => response.json())
      .then(data => {
        return data.results;
      })
      .catch(error => console.log(error));
  };

  async getRandomSentence() {
    return fetch('https://baconipsum.com/api/?type=all-meat&sentences=1&start-with-lorem=1')
      .then(response => response.json())
      .then(data => {
        return data
      })
      .catch(error => console.log(error));
  }

  handleChangeIndex(e) {
    if (this.isInRange(e.target.value, 0, dataList.length - 1)) {
      this.setState({ moreIndex: e.target.value });
    } else {
      alert('OUT OF RANGE');
    }
  };

  loadMoreTop() {
    this.isLoadTopAlready = true;
    this.forceUpdate();
  }

  loadMoreBottom() {
    this.isLoadBottomAlready = true;
    this.forceUpdate();
  }

  isIdAlready(id: string): boolean {
    for (let i = 0; i <= dataList.length - 1; i++) {
      if (dataList[i].itemId === id) return true;
    }
    return false;
  }

  isInRange(index: number, startIndex: number, endIndex: number): boolean {
    return index >= startIndex && index <= endIndex;
  }

  randomItem(index): Object {
    const result = { ...fakeData };
    result.itemId = result.itemId + index;
    result.userName = result.userName + index;
    result.msgContent = ListMessageExample[Math.floor(Math.random() * 20)];
    result.avatar = result.avatar + Math.floor(Math.random() * 99) + ".jpg";
    return result;
  }

  _fakeDataList() {
    let _fakeDataList = [];
    for (let i = 0; i < DATA_NUMBER; i++) {
      _fakeDataList.push(this.randomItem(i));
    }
    return _fakeDataList;
  }

  onAddItem() {
    const { moreIndex } = this.state;
    const item = this.randomItem();
    if (!this.isIdAlready(item.itemId) &&
      this.isInRange(moreIndex, 0, dataList.length - 1)) {
      dataList.splice(moreIndex, 0, item);
      this.forceUpdate();
    }
  }

  _renderControlView = () => {
    const { moreIndex } = this.state;
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

      </div>
    );
  };

  _renderBtnTop = () => {
    return (
      <div style={{ display: 'flex', paddingTop: "50px", paddingRight: '20px', justifyContent: 'flex-end' }}>
        <button onClick={this.loadMoreTop}
                className={this.isLoadTopAlready ? "btn-hidden btn-load-more" : "btn-load-more"}>
          Load more top...
        </button>
      </div>
    )
  };

  _renderList = () => {
    return (
      <Masonry height={500}
               style={{ marginTop: "10px", borderRadius: '5px' }}
               id={'Masonry'}
               data={this.fakeDataList}
               cellMeasurerCache={this._cache}
               preRenderCellCount={3}/>
    )
  };

  _renderBtnBottom = () => {
    return (
      <div style={{ display: 'flex', paddingTop: "20px", paddingRight: '20px', justifyContent: 'flex-end' }}>
        <button onClick={this.loadMoreBottom}
                className={this.isLoadBottomAlready ? "btn-hidden btn-load-more" : "btn-load-more"}>
          Load more bottom...
        </button>
      </div>
    )
  };

  render() {
    const { isLoading } = this.state;
    return (
      isLoading ?
        <div>Loading...</div>
        :
        <div className={'container'}>
          {this._renderControlView()}
          {this._renderBtnTop()}
          {this._renderList()}
          {this._renderBtnBottom()}
        </div>
    );
  }
}

export default DemoList;
