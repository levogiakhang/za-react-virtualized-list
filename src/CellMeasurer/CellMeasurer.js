/** @flow */
import * as React from 'react';
import CellMeasurerCache from "./CellMeasurerCache";
import { Position } from "../utils/types";
import * as ReactDOM from "react-dom";
import ResizeObserver from 'resize-observer-polyfill';

type OnChangedHeightCallback = (params: {|
  itemId: string,
  newHeight: number
|}) => void

type Props = {
  id: string,
  cache: CellMeasurerCache,
  children: React.Element<*>,
  position: Position,
  onChangedHeight: OnChangedHeightCallback,
}

export default class CellMeasurer extends React.PureComponent<Props> {
  constructor(props) {
    super(props);

    this._cellMeasurer = undefined;
    this.resizeObserver = undefined;

    this.onChildrenChangeHeight = this.onChildrenChangeHeight.bind(this);
  }

  // _childId: string = this.props.child.getItemId();

  componentDidMount() {
    this._cellMeasurer = ReactDOM.findDOMNode(this);
    this.resizeObserver = new ResizeObserver(this.onChildrenChangeHeight);
    this.resizeObserver.observe(this._cellMeasurer);
  }

  componentWillUnmount() {
    this.resizeObserver.disconnect(this._cellMeasurer);
  }

  onChildrenChangeHeight() {
    this._checkChangedHeight();
  };

  render() {
    const { children, id, position: { top, left } } = this.props;

    return (
      <div id={id}
           style={{
             position: 'absolute',
             top: top,
             left: left,
             width: '100%'
           }}>
        {children}
      </div>
    );
  }

  componentDidUpdate() {
  }

  get getCellPosition(): Position {
    return this.props.position;
  }

  get getCellId(): string {
    return this.props.id;
  }

  get getCache(): CellMeasurerCache {
    return this.props.cache;
  }

  _checkChangedHeight() {
    const { id, onChangedHeight } = this.props;

    this._newHeight = this._getCellHeight();

    if (this._oldHeight !== this._newHeight) {
      this._oldHeight = this._newHeight;
      onChangedHeight(id, this._newHeight);
    }
  }

  _getCellHeight() {
    if (
      this._cellMeasurer &&
      this._cellMeasurer.ownerDocument &&
      this._cellMeasurer.ownerDocument.defaultView &&
      this._cellMeasurer instanceof this._cellMeasurer.ownerDocument.defaultView.HTMLElement
    ) {

      const styleHeight = this._cellMeasurer.style.height;

      const height = Math.round(this._cellMeasurer.offsetHeight);

      if (styleHeight) {
        this._cellMeasurer.style.height = styleHeight;
      }

      return height;
    }
  }
}