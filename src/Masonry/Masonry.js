// @flow

import React from 'react';
import type { CellRenderer } from "../utils/types";
import CellMeasurerCache from "../CellMeasurer/CellMeasurerCache";
import Message from "../Message/Message";
import CellMeasurer from "../CellMeasurer/CellMeasurer";
import * as ReactDOM from "react-dom";
import PositionCache from './PositionCache';

type Props = {
  className?: string,
  id?: ?string,
  style?: mixed,
  height: number,
  preRenderCellCount: number,
  cellRenderer: CellRenderer,
  cellCount: number,
  cellMeasurerCache: CellMeasurerCache
};

class Masonry extends React.PureComponent<Props> {
  constructor(props) {
    super(props);

    this.state = {
      isScrolling: false
    };

    this._renderedCellMaps = new Map();

    this._calculateBatchSize = this._calculateBatchSize.bind(this);
    this._onScroll = this._onScroll.bind(this);
    this._onResize = this._onResize.bind(this);
    this._updateRenderedCellsMap = this._updateRenderedCellsMap.bind(this);
  }

  componentDidMount() {
    const masonry = ReactDOM.findDOMNode(this);
    masonry.addEventListener('scroll', this._onScroll);
    masonry.addEventListener('resize', this._onResize);
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
      cellRenderer,
      preRenderCellCount,
      cellCount,
      cellMeasurerCache
    } = this.props;

    const estimateTotalHeight = this._getEstimatedTotalHeight(cellCount, 100);

    const children = [];

    const numOfCellOnBatch =
      this._calculateBatchSize(preRenderCellCount, cellMeasurerCache.defaultHeight, height)
      / cellMeasurerCache.defaultHeight;

    // for (let i = 0; i <= numOfCellOnBatch - 1; i++)
    //   children.push( () => {
    //     cellRenderer({
    //       id,
    //       isScrolling,
    //       style: {
    //         height: 120,
    //         position: 'absolute',
    //         width: '100%',
    //       },
    //     })}
    //   );

    for (let i = 0; i <= numOfCellOnBatch - 1; i++) {
      // TODO: store all cells to a map.
      const top = 120 * i; // find in maps the cell before in batch size
      const left = 0;
      children.push(
        cellRenderer({
          item: {
            name: {
              "title":"mr",
              "first":"Khang",
              "last":"Le"
            },
            login: { uuid: '123' },
            registered: { date: '2007-04-07T04:21:47Z' },
            picture: { thumbnail: 'https://randomuser.me/api/portraits/thumb/women/60.jpg' }
          },
          index: 1,
          top: top,
          left: left
        })
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

  // _pushChildrenContent(children: [], cellRenderer, cellCount) {
  //   for (let i = 0; i <= cellCount - 1; i++)
  //     children.push(
  //       cellRenderer({
  //         index,
  //         isScrolling,
  //         style: {},
  //       }),
  //     );
  // }
}

export default Masonry;