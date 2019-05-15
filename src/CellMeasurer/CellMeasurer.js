/** @flow */
import * as React from 'react';
import CellMeasurerCache from "./CellMeasurerCache";
import { Position } from "../utils/types";
import * as ReactDOM from "react-dom";

type Props = {
  id: string,
  cache: CellMeasurerCache,
  children: React.Element<*>,
  position: Position,
}

export default class CellMeasurer extends React.PureComponent<Props> {
  constructor(props) {
    super(props);
  }

  _position: Position = { top: this.props.position.top, left: this.props.position.left };
  _cellHeight: number;
  _id: string = this.props.id;

  componentDidMount() {
    // const { children } = this.props;
    // const cell = ReactDOM.findDOMNode(this);
    // cell.addEventListener('resize', () => {console.log('re')});
    // console.log(document.getElementById(this._id).getBoundingClientRect());
  }

  onResize() {

  }

  render() {
    const { children } = this.props;
    return (
      <div id={this._id}
           ref={"abc"}
           style={{
             position: 'absolute',
             top: this._position.top,
             left: this._position.left,
             width: '100%'}}>
        {children}
      </div>
    );
  }

  componentDidUpdate() {
    this._cellHeight = document.getElementById(this._id).getBoundingClientRect();
    console.log(this._cellHeight);
  }

  get cellHeight() {
    const { cache } = this.props;
    if (this._cellHeight === undefined) return cache.defaultHeight;
    return this._cellHeight;
  }

  get getCellPosition() {
    return this._position;
  }

  set setCellPosition(position: Position) {
    this._position = position;
  }

  get cellId() {
    return this._id;
  }
}