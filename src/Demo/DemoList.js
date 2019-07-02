import React from 'react';
import './css/DemoList.css';
import CellMeasurerCache from "../CellMeasurer/CellMeasurerCache";
import Masonry from "../Masonry/Masonry";
import { fakeData } from "../utils/FakeData";
import { ListMessageExample } from "../utils/ListMessageExample";

const DATA_NUMBER = 20;

class DemoList extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      moreIndex: 0,
    };

    this.loadTopCount = 2;
    this.loadBottomCount = 5;

    this.fakeDataList = this._fakeDataList();
    this.itemCount = DATA_NUMBER;
    this._cache = new CellMeasurerCache({
      defaultHeight: 200,
    });

    this.handleChangeIndex = this.handleChangeIndex.bind(this);
    this.loadMoreTop = this.loadMoreTop.bind(this);
    this.loadMoreBottom = this.loadMoreBottom.bind(this);
    this.onAddItem = this.onAddItem.bind(this);
    this.scrollToItem = this.scrollToItem.bind(this);
  }

  componentDidMount(): void {
    this.masonry = React.createRef();
    this.setState({ isLoading: false });
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
      this.setState({ moreIndex: e.target.value });
    } else {
      alert('OUT OF RANGE');
    }
  };

  loadMoreTop() {
    if (this.loadTopCount > 0) {
      this._generateMoreItems(10);
      this.loadTopCount--;
    }
  }

  loadMoreBottom() {
    if (this.loadBottomCount > 0) {
      this._generateMoreItems(10, false);
      this.loadBottomCount--;
    }
  }

  onAddItem() {
    const { moreIndex } = this.state;
    const item = this._randomItem(this.itemCount);
    this.itemCount++;
    if (!this._isIdAlready(item.itemId) &&
      this._isInRange(moreIndex, 0, this.fakeDataList.length )) {
      this.fakeDataList.splice(moreIndex, 0, item);
      this.forceUpdate();
    }
  };

  scrollToItem() {
    console.log(this.masonry);
    this.masonry.current.scrollToSpecialItem('id_26');
  };

  _isIdAlready = function (id: string): boolean {
    for (let i = 0; i <= this.fakeDataList.length - 1; i++) {
      if (this.fakeDataList[i].itemId === id) return true;
    }
    return false;
  };

  _isInRange = function (index: number, startIndex: number, endIndex: number): boolean {
    return index >= startIndex && index <= endIndex;
  };

  _randomItem = function (index): Object {
    const result = { ...fakeData };
    result.itemId = result.itemId + index;
    result.userName = result.userName + index;
    result.msgContent = ListMessageExample[Math.floor(Math.random() * 20)];
    result.avatar = result.avatar + Math.floor(Math.random() * 99) + ".jpg";
    return result;
  };

  _generateMoreItems(num: number, isTop = true) {
    if (isTop) {
      for (let i = 0; i < num; i++) {
        this.fakeDataList.unshift(this._randomItem(this.itemCount + i));
      }
    } else {
      for (let i = 0; i < num; i++) {
        this.fakeDataList.push(this._randomItem(this.itemCount + i));
      }
    }
    this.itemCount += num;
  };

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

        <button onClick={this.scrollToItem}> Scroll To</button>

      </div>
    );
  };

  _renderList = () => {
    return (
      <Masonry height={500}
               ref={this.masonry}
               style={{ marginTop: "10px", borderRadius: '5px' }}
               id={'Masonry'}
               data={this.fakeDataList}
               cellMeasurerCache={this._cache}
               numOfOverscan={3}
               loadMoreTopFunc={this.loadMoreTop}
               loadMoreBottomFunc={this.loadMoreBottom}
               isStartAtBottom={true}/>
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
          {this._renderList()}
        </div>
    );
  }
}

export default DemoList;
