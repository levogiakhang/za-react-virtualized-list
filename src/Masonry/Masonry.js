// @flow

import React from 'react';
import CellMeasurerCache from "../CellMeasurer/CellMeasurerCache";
import CellMeasurer from "../CellMeasurer/CellMeasurer";
import * as ReactDOM from "react-dom";
import PositionCache from './PositionCache';
import Message from "../Message/Message";
import { NOT_FOUND, NOT_UNIQUE, PREFIX } from "../utils/value";

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

    // Map stores id -> position;
    this._positionMaps = new Map();

    this._masonry = undefined;

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
      this._updateItemOnMap(PREFIX + item.itemId, cellMeasurerCache.defaultHeight);
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

    // console.log(data);

    // array item is rendered in the batch.
    const children = [];

    // number of items in viewport + overscan top + overscan bottom.
    const itemsInBatch = this._getItemsFromOffset(scrollTop);

    this._calculateItemsPosition();

    for (let i = 0; i <= itemsInBatch.length - 1; i++) {
      // TODO: store all cells to a map.

      const index = this._getIndexFromId(itemsInBatch[i]);

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
            id: PREFIX + mess.getItemId,
            position: { top: this._positionMaps.get(itemsInBatch[i]), left: 0 },
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

    const estimateTotalHeight = this._getEstimatedTotalHeight();

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
    const { data, cellMeasurerCache } = this.props;

    if (!this._renderedCellMaps || this._renderedCellMaps.size === 0) {
      return data.length * cellMeasurerCache.defaultHeight;
    }

    let totalHeight = 0;
    this._renderedCellMaps.forEach((item) => {
      totalHeight += item;
    });
    return totalHeight;
  }

  _updateItemOnMap(itemId: string, height: number): void {
    this._renderedCellMaps.set(itemId, height);
  }

  _updateItemPositionOnMap(itemId: string, positionTop: number) {
    this._positionMaps.set(itemId, positionTop);
  }

  // calculate all items' position
  _calculateItemsPosition() {
    const { data, cellMeasurerCache: { defaultHeight } } = this.props;
    let currentPosition = 0;

    data.forEach((item) => {
      this._updateItemPositionOnMap(PREFIX + item.itemId, currentPosition);
      if (this._renderedCellMaps.has(item.itemId)) {
        currentPosition += this._renderedCellMaps.get(item.itemId);
      } else {
        currentPosition += defaultHeight;
      }
      //console.log(currentPosition);
    });
  }

  // calculate items' position from specified position to the end => reduces number of calculation
  _calculateItemsPositionFrom(startPosition: number) {
    /* TODO: tìm xem vị trí cần lấy là thuộc phần tử thứ bao nhiêu,
        tạo vòng lặp từ vị trí đó đến cuối mảng
    */
  }

  _getItemIdFromPosition(positionTop: number): string {
    for (let key of this._positionMaps.keys()) {
      if (!this._renderedCellMaps.has(key)) return NOT_FOUND;
      if (positionTop >= this._positionMaps.get(key) &&
        positionTop <= this._positionMaps.get(key) + this._renderedCellMaps.get(key)) {
        return key;
      }
    }
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

    /*
        số lượng item trong view port cần biết item nào đang ở vị trí đầu tiên xuất hiện
        trong view port + height của nó + lần lượt các item sau nó
        cho đến khi vị trí của item thứ i > scrollTop + height;
     */
    const numOfItemInViewport = height / defaultHeight;

    if (scrollTop < overscanOnPixel) {
      // Top: số lượng item trên top < preRenderCellCount
    } else if (scrollTop > this._getEstimatedTotalHeight() - height - overscanOnPixel) {
      // Bottom: số lượng item dưới < preRenderCellCount
    } else {
      // Middle
      for (let i = 0; i <= 2 * preRenderCellCount + numOfItemInViewport; i++) {
        arrResult.push(PREFIX + data[index + i - 5].itemId);
      }
    }

    return arrResult;
  }

  /*
   *  Get index of a item in data array by id
   *  @param:
   *        + itemId (string): identification of item. This id is unique for each item in array.
   *  @return:
   *        + (number): a value represents index of that item in the array.
   *        + NOT_FOUND (-1): if item isn't in the array.
   *        + NOT_UNIQUE (-2): if more than 1 item in the array.
   */
  _getIndexFromId(itemId: string): number {
    const { data } = this.props;
    // only for props.data
    if (data) {
      const results = data.filter((item) => {
        const id = item.itemId;
        return PREFIX + id === itemId
      });
      if (results.length === 0) {
        return NOT_FOUND;
      } else if (results.length > 1) {
        return NOT_UNIQUE;
      } else {
        return data.indexOf(results[0]);
      }
    }
  }
}

export default Masonry;