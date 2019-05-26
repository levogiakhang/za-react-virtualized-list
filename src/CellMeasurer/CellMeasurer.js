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
}

export default class CellMeasurer extends React.PureComponent<Props> {
  constructor(props) {
    super(props);

    this._cellMeasurer = undefined;
    this._cellHeight = undefined;
    // this.resizeObserver = undefined;
  }

  // _childId: string = this.props.child.getItemId();

  componentDidMount() {
    this._cellMeasurer = ReactDOM.findDOMNode(this);
    this._cellHeight = this._cellMeasurer.getBoundingClientRect().height;
    // this.resizeObserver = new ResizeObserver(this.onChildChangeHeight);
    // this.resizeObserver.observe(this._cellMeasurer);
  }

  componentWillUnmount() {
    // this.resizeObserver.disconnect(this._cellMeasurer);
  }

  render() {
    const { children, id, position: { top, left } } = this.props;

    // detect item height changed
    // TODO: Button on Message click not call re-render -> cellMeasurer not change in DOM tree

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

  _isChangedHeight(oldHeight: number, newHeight: number): boolean {
    return oldHeight !== newHeight;
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