/** @flow */
import * as React from 'react';
import CellMeasurerCache from "./CellMeasurerCache";
import { Position } from "../utils/types";
import Masonry from '../Masonry/Masonry'
import * as ReactDOM from "react-dom";

type Props = {
  id: string,
  cache: CellMeasurerCache,
  children: React.Element<*>,
  position: Position,
  onCellChangeHeight: OnChildChangeHeightCallback,
}

type OnChildChangeHeightCallback = (params: {|
  itemId: string,
  oldHeight: number,
  newHeight: number
|}) => void

export default class CellMeasurer extends React.PureComponent<Props> {
  constructor(props) {
    super(props);

    this._cellMeasurer = undefined;
    this._cellHeight = undefined;
    // this.resizeObserver = undefined;

    this.onChildChangeHeight = this.onChildChangeHeight.bind(this);
  }

  // _childId: string = this.props.child.getItemId();

  componentDidMount() {
    this._cellMeasurer = ReactDOM.findDOMNode(this);
    this._cellHeight = this._cellMeasurer.getBoundingClientRect().height;
    this.onChildChangeHeight(this.props.id, this._cellHeight, this._cellHeight);
    // this.resizeObserver = new ResizeObserver(this.onChildChangeHeight);
    // this.resizeObserver.observe(this._cellMeasurer);
  }

  componentWillUnmount() {
    // this.resizeObserver.disconnect(this._cellMeasurer);
  }


  onChildChangeHeight(itemId, oldHeight, newHeight) {
    // update cellHeight
    this._cellHeight = newHeight;
    // console.log('id: ' + itemId + ", old: " + oldHeight + ", new: " + newHeight);
    this.props.onCellChangeHeight(itemId, oldHeight, newHeight);
  }

  render() {
    const { children, id, position: { top, left } } = this.props;

    // detect item height changed
    // TODO: Button on Message click not call re-render -> cellMeasurer not change in DOM tree
    if (this._cellMeasurer) {
      const oldHeight = Math.round(this._cellHeight);
      const newHeight = this._cellMeasurer.offsetHeight;
      if (oldHeight !== newHeight) {
        this.onChildChangeHeight(id, oldHeight, newHeight);
      }
    }

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
    this._cellHeight = this._cellMeasurer.offsetHeight;
  }

  get getCellHeight(): number {
    const { cache } = this.props;
    if (this._cellHeight === undefined) return cache.defaultHeight;
    return this._cellHeight;
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
}