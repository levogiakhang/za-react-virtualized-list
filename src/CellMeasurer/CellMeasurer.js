/** @flow */
import * as React from 'react';
import CellMeasurerCache from "./CellMeasurerCache";
import { Position } from "../Utils/types";

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
  _cellHeight: number = this.props.cache.height;

  componentDidMount() {
    const { children } = this.props;
  }

  onResize() {

  }

  render() {
    const { children } = this.props;
    return (
      <div style={{position: 'absolute', top: this._position.top, left: this._position.left}}>
        {children}
      </div>
    );
  }

  get cellHeight() {
    const { cache } = this.props;
    if (this._cellHeight === undefined) return cache.defaultHeight;
    return this._cellHeight;
  }

  get getPosition() {
    return this._position;
  }

  set setPosition(position: Position) {
    this._position = position;
  }
}