import React from 'react';
import './css/DemoList.css';
import CellMeasurer from "../CellMeasurer/CellMeasurer";
import CellMeasurerCache from "../CellMeasurer/CellMeasurerCache";
import Message from "../Message/Message";
import { ListMessageExample } from '../Utils/ListMessageExample';
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
    this._renderCell = this._renderCell.bind(this);
    this._cache = new CellMeasurerCache({
      defaultHeight: 250,
      height: 300,
    });
  }

  async componentDidMount(): void {
    const data = await this.getData();
    data.forEach(item => dataList.push(item));
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

  _renderCell({ item, index }) {
    const { name, login: { uuid }, registered: { date }, picture: { thumbnail } } = item;
    const displayName = name.first + " " + name.last;
    return (
      <CellMeasurer cache={this._cache} id={uuid} position={{ top: 1, left: 1 }}>
        <Message id={uuid}
                 userAvatarUrl={thumbnail}
                 userName={displayName}
                 messageContent={message[Math.floor(Math.random() * (message.length))]}
                 sentTime={date}
                 isMine={index % 2 === 0}/>
      </CellMeasurer>

    )
  };

  _renderList = (dataList) => {
    const { name } = dataList;
    return (
      // dataList.map(() => <p>{name}</p>)
      // dataList.map((item, index) => this._renderCell(item, index))
      <Masonry height={500}
               cellCount={dataList.length}
               cellRenderer={this._renderCell}/>
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
