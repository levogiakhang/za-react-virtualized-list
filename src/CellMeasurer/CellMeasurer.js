/** @flow */
import * as React from 'react';
import CellMeasurerCache from "./CellMeasurerCache";
import { Position } from "../utils/types";
import * as ReactDOM from "react-dom";
import ResizeObserver from 'resize-observer-polyfill';
import throttle from "../utils/throttle";
import { THROTTLING_TIMER } from "../utils/value";

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

    this._oldHeight = this.props.cache.defaultHeight;
    this._newHeight = undefined;
    this._cellMeasurer = undefined;
    this.resizeObserver = undefined;

    this.onChildrenChangeHeight = this.onChildrenChangeHeight.bind(this);
  }

  // _childId: string = this.props.child.getItemId();

  componentDidMount() {
    this._cellMeasurer = ReactDOM.findDOMNode(this);
    this.resizeObserver = new ResizeObserver(throttle(this.onChildrenChangeHeight, THROTTLING_TIMER));
    this.resizeObserver.observe(this._cellMeasurer);
  }

  componentWillUnmount() {
    this.resizeObserver.disconnect(this._cellMeasurer);
  }

  onChildrenChangeHeight() {
    if (this._isChangedHeight()) {
      this.props.onChangedHeight(this.props.id, this._newHeight);
    }
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

  _isChangedHeight() {
    this._newHeight = this._getCellHeight();
    if (this._oldHeight !== this._newHeight) {
      //console.log('id: ' + this.props.id + " old: " + this._oldHeight + ' new: ' + this._newHeight  );
      this._oldHeight = this._newHeight;
      return true;
    }
    return false;
  }

  _getCellHeight() {
    if (
      this._cellMeasurer &&
      this._cellMeasurer.ownerDocument &&
      this._cellMeasurer.ownerDocument.defaultView &&
      this._cellMeasurer instanceof this._cellMeasurer.ownerDocument.defaultView.HTMLElement
    ) {
      return Math.round(this._cellMeasurer.offsetHeight);
    }
  }
}