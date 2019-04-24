import React from 'react';
import logo from './logo.svg';
import './App.css';
import CellMeasurer from "./CellMeasurer/CellMeasurer";
import CellMeasurerCache from "./CellMeasurer/CellMeasurerCache";

let dataList = [];

const DATA_NUMBER = 20;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
    };

    this.getData = this.getData.bind(this);
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

  _renderCell = (item, index) => {
    const { login: { uuid }, picture: { thumbnail } } = item;
    console.log(index);
    return (
      <CellMeasurer cache={this._cache} id={uuid}>
        <div>
          <img src={thumbnail} alt="img" className='App-logo'/>
        </div>
      </CellMeasurer>

    )
  };

  _renderList = (dataList) => {
    const { name } = dataList;
    return (
      // dataList.map(() => <p>{name}</p>)
      dataList.map((item, index) => this._renderCell(item, index))
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

export default App;
