// @flow

import React from 'react';
import CellMeasurerCache from "../CellMeasurer/CellMeasurerCache";
import CellMeasurer from "../CellMeasurer/CellMeasurer";
import * as ReactDOM from "react-dom";
import PositionCache from './PositionCache';

type Props = {
  className?: string,
  id?: ?string,
  style?: mixed,
  height: number,
  preRenderCellCount: number,
  data: any,
  cellMeasurerCache: CellMeasurerCache
};

class Masonry extends React.PureComponent<Props> {
  constructor(props) {
    super(props);

    this.state = {
      isScrolling: false,
      scrollTop: 0,
    };

    // Map lưu trữ height của những cell đã đc render
    this._renderedCellMaps = new Map();

    this._masonry = '';

    this._calculateBatchSize = this._calculateBatchSize.bind(this);
    this._onScroll = this._onScroll.bind(this);
    this._onResize = this._onResize.bind(this);
    this._updateRenderedCellsMap = this._updateRenderedCellsMap.bind(this);
  }

  componentDidMount() {
    this._masonry = ReactDOM.findDOMNode(this);
    this._masonry.addEventListener('scroll', this._onScroll);
    this._masonry.addEventListener('resize', this._onResize);
  }

  componentWillUnmount() {
    this._masonry.removeEventListener('scroll', this._onScroll);
    this._masonry.removeEventListener('resize', this._onResize);
  }

  recomputeCellPositions() {
    this._positionCache = new PositionCache();
    this.forceUpdate();
  }

  render() {
    const {
      className,
      id,
      height,
      style,
      isScrolling,
      preRenderCellCount,
      data,
      cellMeasurerCache
    } = this.props;

    const { scrollTop } = this.state;

    const estimateTotalHeight = this._getEstimatedTotalHeight(data.length, cellMeasurerCache.defaultHeight);

    const children = [];

    const numOfCellOnBatch =
      this._calculateBatchSize(preRenderCellCount, cellMeasurerCache.defaultHeight, height)
      / cellMeasurerCache.defaultHeight;


    if (document.getElementById(id) !== null) {
      // console.log(this.state.scrollTop);
    }

    console.log(scrollTop);

    for (let i = 0; i <= numOfCellOnBatch - 1; i++) {
      // TODO: store all cells to a map.
      const top = 120 * i; // find in maps the cell before in batch size
      const left = 0;
      children.push(
        <CellMeasurer cache={this._cache}
                      id={'a'}
                      position={{ top: top, left: left }}>
          <div>a</div>
          <button onClick={() => {}}>a</button>
        </CellMeasurer>
      )
    }

    return (
      <div className={className}
           id={id}
           onScroll={this._onScroll}
           style={{
             backgroundColor: 'cornflowerblue',
             boxSizing: 'border-box',
             overflowX: 'hidden',
             overflowY: estimateTotalHeight < height ? 'hidden' : 'auto',
             width: 'auto',
             height: height,
             position: 'relative',
             willChange: 'transform',
             ...style
           }}>
        <div className="innerScrollContainer"
             style={{
               width: '100%',
               height: estimateTotalHeight,
               maxWidth: '100%',
               maxHeight: estimateTotalHeight,
               overflow: 'hidden',
               position: 'relative',
               pointerEvents: isScrolling ? 'none' : '', // property defines whether or not an element reacts to pointer events.
             }}>
          {children}
        </div>
      </div>
    );
  }

  _onScroll() {
    this.setState({ scrollTop: this._masonry.scrollTop });
    // this.forceUpdate();
    // console.log(document.getElementById(this.props.id).scrollTop);
  }

  _onResize() {
    // this.forceUpdate();
    console.log('resize');
  }

  _onUpdate(key: any) {

  }

  _updateRenderedCellsMap() {

  }

  _getEstimatedTotalHeight(cellCount: number, defaultCellHeight: number): number {
    return cellCount * defaultCellHeight;
  }

  _calculateBatchSize(preRenderCellCount: number, cellHeight: number, masonryHeight: number): number {
    const overScanByPixel = preRenderCellCount * cellHeight;
    return 2 * overScanByPixel + masonryHeight;
  }

  _updateCellToMap(cellId: string, height: number): void {
    this._renderedCellMaps.set(cellId, height);
  }
}

export default Masonry;