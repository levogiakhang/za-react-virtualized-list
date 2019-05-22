// @flow

import React from 'react';
import CellMeasurerCache from "../CellMeasurer/CellMeasurerCache";
import CellMeasurer from "../CellMeasurer/CellMeasurer";
import * as ReactDOM from "react-dom";
import PositionCache from './PositionCache';
import Message from "../Message/Message";

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

    this._masonry = undefined;

    this._calculateBatchSize = this._calculateBatchSize.bind(this);
    this._onScroll = this._onScroll.bind(this);
    this._onResize = this._onResize.bind(this);
    this._updateItemOnMap = this._updateItemOnMap.bind(this);
    this.onChildrenChangeHeight = this.onChildrenChangeHeight.bind(this);
    this._getItemsFromOffset = this._getItemsFromOffset.bind(this);
    this.scrollToOffset = this.scrollToOffset.bind(this);
  }

  componentDidMount() {
    const { data, cellMeasurerCache } = this.props;

    this._masonry = ReactDOM.findDOMNode(this);
    this._masonry.addEventListener('scroll', this._onScroll);
    this._masonry.addEventListener('resize', this._onResize);

    data.forEach((item) => {
      this._updateItemOnMap(item.login.uuid, cellMeasurerCache.defaultHeight);
    });
  }

  componentWillUnmount() {
    this._masonry.removeEventListener('scroll', this._onScroll);
    this._masonry.removeEventListener('resize', this._onResize);
  }

  recomputeCellPositions() {
    this._positionCache = new PositionCache();
    this.forceUpdate();
  }

  onChildrenChangeHeight(itemId: string, newHeight: number) {
    this._updateItemOnMap(itemId, newHeight);
    this.forceUpdate();
  }

  scrollToOffset(top) {
    this._masonry.scrollTo(0, top);
  }

  render() {
    const {
      className,
      id,
      height,
      style,
      isScrolling,
      data,
      cellMeasurerCache
    } = this.props;

    const { scrollTop } = this.state;

    const estimateTotalHeight = this._getEstimatedTotalHeight(data.length, cellMeasurerCache.defaultHeight);

    const children = [];

    if (document.getElementById(id) !== null) {
      // console.log(this.state.scrollTop);
    }

    // console.log(data);

    const itemsInBatch = this._getItemsFromOffset(scrollTop);

    for (let i = 0; i <= itemsInBatch.length - 1; i++) {
      // TODO: store all cells to a map.

      const index = data.indexOf(data.filter((item) => {
        return item.login.uuid === itemsInBatch[i]
      })[0]);

      const top = 100 * index; // find in maps the cell before in batch size
      const left = 0;

      switch (typeof data[index]) {
        case "object": {
          const mess = new Message({
            id: data[index].login.uuid,
            userAvatarUrl: data[index].picture.thumbnail,
            userName: data[index].name.first,
            messageContent: data[index].email,
            sentTime: data[index].registered.date
          });

          const cellMeasurer = new CellMeasurer({
            cache: cellMeasurerCache,
            id: 'HOC_' + mess.getItemId,
            position: { top: top, left: left },
          });

          children.push(
            <CellMeasurer cache={cellMeasurer.getCache}
                          id={cellMeasurer.getCellId}
                          key={cellMeasurer.getCellId}
                          position={cellMeasurer.getCellPosition}>
              <Message id={mess.getItemId}
                       key={mess.getItemId}
                       userAvatarUrl={mess.getUserAvatarUrl}
                       userName={mess.getUserName}
                       messageContent={mess.getMessageContent}
                       sentTime={mess.getSentTime}/>
            </CellMeasurer>
          );

          this._updateItemOnMap(cellMeasurer.getCellId, cellMeasurer.getCellHeight);

          break;
        }

        default: {
          break;
        }
      }
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
    this._getItemsFromOffset(this._masonry.scrollTop);
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

  _getEstimatedTotalHeight(): number {
    const itemCount = this.props.data.length;
    const defaultCellHeight = this.props.cellMeasurerCache.defaultHeight;
    return itemCount * defaultCellHeight;
  }

  _calculateBatchSize(preRenderCellCount: number, cellHeight: number, masonryHeight: number): number {
    const overScanByPixel = preRenderCellCount * cellHeight;
    return 2 * overScanByPixel + masonryHeight;
  }

  _updateItemOnMap(itemId: string, height: number): void {
    this._renderedCellMaps.set(itemId, height);
  }

  /*
   *  Return an array that stores itemId of items rendering in batch
   *  @param:
   *      scrollTop: offset top of Masonry
   *  @return: an Array<string>
   */
  _getItemsFromOffset(scrollTop: number): Array<string> {
    const { height, preRenderCellCount, cellMeasurerCache: { defaultHeight }, data } = this.props;
    const overscanOnPixel = defaultHeight * preRenderCellCount;

    let arrResult: Array<string> = [];

    // ước lượng vị trí item hiện tại đang scroll tới, bị sai nếu như height thật của item sai số quá lớn so với defaultHeight
    // TODO: solve sai số;
    const index = Math.floor(scrollTop / 100);
    // console.log(data[index].login.uuid);

    for (let i = 0; i <= 5; i++)
      arrResult.push(data[index + i].login.uuid);

    if (scrollTop < overscanOnPixel) {
      // số lượng item trên top < preRenderCellCount
      // console.log('top');
    } else if (scrollTop > this._getEstimatedTotalHeight() - height - overscanOnPixel) {
      // số lượng item dưới < preRenderCellCount
      // console.log('bottom');
    } else {
      // console.log('middle');
    }

    return arrResult;
  }
}

export default Masonry;