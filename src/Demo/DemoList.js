import React from 'react';
import './css/DemoList.css';
import CellMeasurerCache from "../CellMeasurer/CellMeasurerCache";
import {topData, bottomData, KhangObjData, ListMessageExample, KhangObjDataTop} from '../utils/ListMessageExample';
import Masonry from "../Masonry/Masonry";

let dataList = [];
let message = ListMessageExample;

const DATA_NUMBER = 10;

class DemoList extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
    };

    this.getData = this.getData.bind(this);
    this.loadMoreTop = this.loadMoreTop.bind(this);
    this.loadMoreBottom = this.loadMoreBottom.bind(this);

    this._cache = new CellMeasurerCache({
      defaultHeight: 120,
      height: 300,
    });
  }

  async componentDidMount(): void {
    const data = await this.getData();
    data.forEach(item => dataList.push({ itemId: item.login.uuid, ...item }));
    dataList.unshift(KhangObjDataTop);
    dataList.push(KhangObjData);
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

  loadMoreTop() {
    topData.forEach(item => {dataList.unshift(item)});
  }

  loadMoreBottom() {
    bottomData.forEach(item => dataList.push(item));
  }

  _renderList = (dataList) => {
    return (
      <Masonry height={500}
               style={{ marginTop: "60px" }}
               id={'khang'}
               data={dataList}
               cellMeasurerCache={this._cache}
               preRenderCellCount={5}/>
    )
  };

  _renderBtnTop = () => {
    return (
      <div style={{ display: 'flex', paddingTop: "100px", paddingRight: '20px', justifyContent: 'flex-end' }}>
        <button onClick={this.loadMoreTop}>
          Load more top...
        </button>
      </div>
    )
  };

  _renderBtnBottom = () => {
    return (
      <div style={{ display: 'flex', paddingTop: "50px", paddingRight: '20px', justifyContent: 'flex-end' }}>
        <button onClick={this.loadMoreBottom}>
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
        <div>
          {this._renderBtnTop()}
          {this._renderList(dataList)}
          {this._renderBtnBottom()}
        </div>
    );
  }
}

export default DemoList;
