import React from 'react';
import './css/DemoList.css';
import CellMeasurer from "../CellMeasurer/CellMeasurer";
import CellMeasurerCache from "../CellMeasurer/CellMeasurerCache";
import Message from "../Message/Message";
import { KhangObjData, ListMessageExample } from '../utils/ListMessageExample';
import Masonry from "../Masonry/Masonry";

let dataList = [];
let message = ListMessageExample;

const DATA_NUMBER = 100;

class DemoList extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
    };

    this.getData = this.getData.bind(this);
    this._cache = new CellMeasurerCache({
      defaultHeight: 300,
      height: 300,
    });
  }

  async componentDidMount(): void {
    const data = await this.getData();
    data.forEach(item => dataList.push({itemId: item.login.uuid, ...item}));
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

  _renderList = (dataList) => {
    return (
      <Masonry height={500}
               style={{marginTop: "200px"}}
               id={'khang'}
               data={dataList}
               cellMeasurerCache={this._cache}
               preRenderCellCount={5}/>
    )
  };

  render() {
    const { isLoading } = this.state;
    return (
      isLoading ?
        <div>Loading...</div>
        :
        this._renderList(dataList)
    );
  }
}

export default DemoList;
