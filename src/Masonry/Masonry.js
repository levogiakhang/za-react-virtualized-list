// @flow

import React from 'react';
import CellMeasurerCache from "../CellMeasurer/CellMeasurerCache";
import CellMeasurer from "../CellMeasurer/CellMeasurer";
import * as ReactDOM from "react-dom";
import PositionCache from './PositionCache';
import Message from "../Message/Message";
import { NOT_FOUND, NOT_UNIQUE, OUT_OF_RANGE, PREFIX } from "../utils/value";

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

    // A map stores `itemId -> height` of rendered items.
    this._renderedCellMaps = new Map();

    // A map stores `itemId -> topPosition` of rendered items.
    this._positionMaps = new Map();

    // Represents this element.
    this._masonry = undefined;

    this._onScroll = this._onScroll.bind(this);
    this._onResize = this._onResize.bind(this);
    this._updateItemOnMap = this._updateItemOnMap.bind(this);
    this.onChildrenChangeHeight = this.onChildrenChangeHeight.bind(this);
    this._getItemsFromOffset = this._getItemsFromOffset.bind(this);
    this.scrollToOffset = this.scrollToOffset.bind(this);

    const { data, cellMeasurerCache } = this.props;
    data.forEach((item) => {
      this._updateItemOnMap(PREFIX + item.itemId, cellMeasurerCache.defaultHeight);
    });
  }

  componentDidMount() {
    this._masonry = ReactDOM.findDOMNode(this);
    this.scrollToOffset(this._getEstimatedTotalHeight() - this.props.height);
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

  onChildrenChangeHeight(itemId: string, oldHeight: number, newHeight: number) {
    this._updateItemsPositionWhenItemChangedHeight(itemId, oldHeight, newHeight);
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
            userName: index + data[index].name.first,
            messageContent: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
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
                          onCellChangeHeight={this.onChildrenChangeHeight}
                          position={cellMeasurer.getCellPosition}>
              <Message id={mess.getItemId}
                       key={mess.getItemId}
                       userAvatarUrl={mess.getUserAvatarUrl}
                       userName={mess.getUserName}
                       messageContent={mess.getMessageContent}
                       sentTime={mess.getSentTime}/>
            </CellMeasurer>
          );
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

  // @UNSAFE: cellHeight is not updated.
  /*
   *  Get total height in estimation.
   */
  _getEstimatedTotalHeight(): number {
    const { data, cellMeasurerCache } = this.props;

    if (!this._renderedCellMaps || this._renderedCellMaps.size === 0) {
      return data.length * cellMeasurerCache.defaultHeight;
    }

    let totalHeight = 0;
    this._renderedCellMaps.forEach((item) => {
      totalHeight += Math.round(item);
    });
    return totalHeight;
  }

  /*
   *  Add or update an item in _renderedCellMaps
   *  @params:
   *        + itemId (string): identification of item.
   *        + height (number): new height of the item.
   *  @return:
   *        + void.
   */
  _updateItemOnMap(itemId: string, height: number): void {
    this._renderedCellMaps.set(itemId, height);
  }

  /*
 *  Add or update an item in _positionMaps
 *  @params:
 *        + itemId (string): identification of item.
 *        + positionTop (number): new top coordinate of the item.
 *  @return:
 *        + void.
 */
  _updateItemPositionOnMap(itemId: string, positionTop: number): void {
    this._positionMaps.set(itemId, positionTop);
  }

  /*
   *  Calculate all items' position
   */
  _calculateItemsPosition() {
    const { data, cellMeasurerCache: { defaultHeight } } = this.props;
    let currentPosition = 0;
    data.forEach((item) => {
      this._updateItemPositionOnMap(PREFIX + item.itemId, currentPosition);
      if (this._renderedCellMaps.has(PREFIX + item.itemId)) {
        currentPosition += this._renderedCellMaps.get(PREFIX + item.itemId);
      } else {
        currentPosition += defaultHeight;
      }
      //console.log(currentPosition);
    });
  }

  // @UNSAFE
  /*
   *  Update other items' position below the item that changed height.
   */
  _updateItemsPositionWhenItemChangedHeight(itemId: string, oldHeight: number, newHeight: number) {
    const itemPosition = this._getPositionOfItem(itemId);

    this._updateItemOnMap(itemId, newHeight);
    this._calculateItemsPositionFrom(itemPosition);
  }

  // @UNSAFE
  /*
   *  Calculate items' position from specified position to the end => reduces number of calculation
   */
  _calculateItemsPositionFrom(fromPosition: number) {
    const { data } = this.props;
    const itemId = this._getItemIdFromPosition(fromPosition);
    const index = this._getIndexFromId(itemId);

    for (let i = index; i <= data.length - 1; i++) {

    }
  }

  /*
   *  Get item's position by itemId.
   *  @param:
   *        + itemId (string): identification of item.
   *  @return:
   *        + (number): top coordinate of item.
   *        + NOT_FOUND (-1): if item is NOT in _positionMaps.
   */
  _getPositionOfItem(itemId: string): number {
    return this._positionMaps.has(itemId) ? this._positionMaps.get(itemId) : NOT_FOUND
  }

  /*
 *  Get itemId of a item in _positionMaps by position.
 *  @param:
 *        + positionTop (number): position top where wanna get item in this.
 *  @return:
 *        + key (string): itemId.
 *        + NOT_FOUND (-1): if item isn't in the maps.
 *        + OUT_OF_RANGE ('out of range'): if position param is greater than total height.
 */
  _getItemIdFromPosition(positionTop: number): string {
    if (positionTop >= this._getEstimatedTotalHeight()) return OUT_OF_RANGE;
    for (let key of this._positionMaps.keys()) {
      if (!this._renderedCellMaps.has(key)) return NOT_FOUND;
      if (positionTop >= this._positionMaps.get(key) &&
        positionTop <= this._positionMaps.get(key) + this._renderedCellMaps.get(key)) {
        return key;
      }
    }
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

  /*
   *  Get itemId from index.
   *  @param:
   *        + index (number): index of item.
   *  @return:
   *        + a string represents for itemId
   *        + OUT_OF_RANGE (-3): if index out of range of data.
   */
  _getItemIdFromIndex(index: number): string {
    const { data } = this.props;
    const maps = new Map();

    if (index > data.length || index < 0) return OUT_OF_RANGE;

    for (let i = 0; i <= data.length - 1; i++) {
      maps.set(i, data[i].itemId);
    }

    return maps.get(index);
  }

  // @UNSAFE
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

    const index = this._getIndexFromId(this._getItemIdFromPosition(scrollTop));

    const numOfItemInViewport = this._getItemsInViewport(scrollTop, height).length;

    if (scrollTop < overscanOnPixel) {
      // Top: số lượng item trên top < preRenderCellCount
      for (let i = 0; i <= numOfItemInViewport + preRenderCellCount; i++) {
        arrResult.push(PREFIX + data[i].itemId);
      }
    } else if (scrollTop > this._getEstimatedTotalHeight() - height - overscanOnPixel) {
      // Bottom: số lượng item dưới < preRenderCellCount
      for (let i = Math.max(0, index - preRenderCellCount); i < data.length; i++) {
        arrResult.push(PREFIX + data[i].itemId);
      }
    } else {
      // Middle
      if (index + numOfItemInViewport + preRenderCellCount >= data.length) {
        for (let i = Math.max(0, index - preRenderCellCount); i < data.length; i++) {
          arrResult.push(PREFIX + data[i].itemId);
        }
      } else {
        for (let i = Math.max(0, index - preRenderCellCount); i <= index + numOfItemInViewport + preRenderCellCount; i++) {
          arrResult.push(PREFIX + data[i].itemId);
        }
      }
    }

    return arrResult;
  }

  // sai
  /*
   *  Return an array stores all items rendering in viewport.
   *  @params:
   *        + scrollTop (number): this masonry position.
   *        + height (number): viewport's height;
   *  @return:
   *        + empty: if scrollTop is out of range or there isn't any items in viewport.
   *        + (Array<string>): stores all items' id in viewport.
   */
  _getItemsInViewport(scrollTop: number, height: number): Array<string> {
    const itemIdStart = this._getItemIdFromPosition(scrollTop);
    const results = new Array({});

    if (itemIdStart !== NOT_FOUND) {
      results.push(itemIdStart);

      // disparity > 0 when scrollTop position is between `the item's position` and `item's position + its height`.
      const disparity = scrollTop - this._positionMaps.get(itemIdStart);

      let temp = height - disparity;
      let i = 1;
      const itemIndex = this._getIndexFromId(itemIdStart);
      let nextItemHeight = this._renderedCellMaps.get(this._getItemIdFromIndex(itemIndex + i));

      while (temp > nextItemHeight) {
        temp -= nextItemHeight;
        results.push(this._getItemIdFromIndex(itemIndex + i));
        i++;
        nextItemHeight = this._renderedCellMaps.get(this._getItemIdFromIndex(itemIndex + i));
      }
      if (temp > 0) {
        results.push(this._getItemIdFromIndex(itemIndex + i));
      }
    }

    return results;
  }
}

export default Masonry;