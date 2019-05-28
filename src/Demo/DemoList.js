import React from 'react';
import './css/DemoList.css';
import CellMeasurerCache from "../CellMeasurer/CellMeasurerCache";
import {bottomData, itemData, itemDataTop, randomItemData, topData} from '../utils/ListMessageExample';
import Masonry from "../Masonry/Masonry";

let dataList = [];

const DATA_NUMBER = 40;

class DemoList extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      moreIndex: 0,
    };

    this.isLoadTopAlready = false;
    this.isLoadBottomAlready = false;

    this.getData = this.getData.bind(this);
    this.loadMoreTop = this.loadMoreTop.bind(this);
    this.loadMoreBottom = this.loadMoreBottom.bind(this);
    this.isIdAlready = this.isIdAlready.bind(this);
    this.onAddItem = this.onAddItem.bind(this);
    this.cloneObject = this.cloneObject.bind(this);
    this.isInRange = this.isInRange.bind(this);
    this.handleChangeIndex = this.handleChangeIndex.bind(this);

    this._cache = new CellMeasurerCache({
      defaultHeight: 300,
      height: 300,
    });
  }

  async componentDidMount(): void {
    const data = await this.getData();
    data.forEach(item => dataList.push({itemId: item.login.uuid, ...item}));
    dataList.splice(0, 0, itemDataTop);
    dataList.push(itemData);
    this.setState({isLoading: false});
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
      this.setState({moreIndex: e.target.value});
    } else {
      alert('OUT OF RANGE');
    }
  };

  loadMoreTop() {
    topData.forEach(item => {
      if (!this.isIdAlready(item.itemId) &&
        this.isInRange(0, 0, dataList.length - 1)) {
        dataList.splice(0, 0, item);
        this.forceUpdate();
      }
    });
    this.isLoadTopAlready = true;
  }

  loadMoreBottom() {
    bottomData.forEach(item => dataList.push(item));
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

  cloneObject(obj) {
    if (null === obj || "object" !== typeof obj) return obj;
    let copy = obj.constructor();
    for (let attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
  }

  randomItem(): Object {
    const result = this.cloneObject(randomItemData);
    const randomValue = Math.floor(Math.random() * 999 + 1);
    result.itemId = randomItemData.itemId + randomValue;
    result.name.first = randomItemData.name.first + randomValue;
    return result;
  }

  onAddItem() {
    const {moreIndex} = this.state;
    const item = this.randomItem();
    if (!this.isIdAlready(item.itemId) &&
      this.isInRange(moreIndex, 0, dataList.length - 1)) {
      dataList.splice(moreIndex, 0, item);
      this.forceUpdate();
    }
  }

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
                onClick={this.onAddItem}>
          Add new item at
        </button>


        <button className={'btn-control btn-add'}
                onClick={this.onAddItem}>
          Remove item at
        </button>

      </div>
    );
  };

  _renderBtnTop = () => {
    return (
      <div style={{display: 'flex', paddingTop: "50px", paddingRight: '20px', justifyContent: 'flex-end'}}>
        <button onClick={this.loadMoreTop}
                className={this.isLoadTopAlready ? "btn-hidden btn-load-more" : "btn-load-more"}>
          Load more top...
        </button>
      </div>
    )
  };

  _renderList = (dataList) => {
    return (
      <Masonry height={500}
               style={{marginTop: "10px", borderRadius: '5px'}}
               id={'Masonry'}
               data={dataList}
               cellMeasurerCache={this._cache}
               preRenderCellCount={2}/>
    )
  };

  _renderBtnBottom = () => {
    return (
      <div style={{display: 'flex', paddingTop: "20px", paddingRight: '20px', justifyContent: 'flex-end'}}>
        <button onClick={this.loadMoreBottom}
                className={this.isLoadBottomAlready ? "btn-hidden btn-load-more" : "btn-load-more"}>
          Load more bottom...
        </button>
      </div>
    )
  };

  render() {
    const {isLoading} = this.state;
    return (
      isLoading ?
        <div>Loading...</div>
        :
        <div className={'container'}>
          {this._renderControlView()}
          {this._renderBtnTop()}
          {this._renderList(dataList)}
          {this._renderBtnBottom()}
        </div>
    );
  }
}

export default DemoList;
