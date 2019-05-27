// @flow

import React from 'react';
import CellMeasurerCache from "../CellMeasurer/CellMeasurerCache";
import CellMeasurer from "../CellMeasurer/CellMeasurer";
import * as ReactDOM from "react-dom";
import Message from "../Message/Message";
import {NOT_FOUND, NOT_UNIQUE, OUT_OF_RANGE, PREFIX} from "../utils/value";
import {ListMessageExample} from "../utils/ListMessageExample";

type Props = {
  className?: string,
  id?: ?string,
  style?: mixed,
  height: number,
  preRenderCellCount: number,
  data: any,
  cellMeasurerCache: CellMeasurerCache,
};

class Masonry extends React.Component<Props> {
  constructor(props) {
    super(props);

    this.state = {
      isScrolling: false,
      scrollTop: 0,
    };

    this._oldScrollTop = undefined;

    this._currentFirstItemData = undefined;
    this._oldFirstItemData = undefined;

    // A map stores `itemId -> height` of rendered items.
    this._renderedCellMaps = new Map();

    // A map stores `itemId -> topPosition` of rendered items.
    this._positionMaps = new Map();

    // Represents this element.
    this._masonry = undefined;

    this.resizeTimer = undefined;

    this._onScroll = this._onScroll.bind(this);
    this._onResize = this._onResize.bind(this);
    this._setItemOnMap = this._setItemOnMap.bind(this);
    this.onChildrenChangeHeight = this.onChildrenChangeHeight.bind(this);
    this._getItemsFromOffset = this._getItemsFromOffset.bind(this);
    this.scrollToOffset = this.scrollToOffset.bind(this);
    this._calculateItemsPositionFromSpecifiedItem = this._calculateItemsPositionFromSpecifiedItem.bind(this);

    const {data, cellMeasurerCache} = this.props;
    data.forEach((item) => {
      this._setItemOnMap(PREFIX + item.itemId, cellMeasurerCache.defaultHeight);
    });
    this._currentFirstItemData = PREFIX + data[0].itemId;
    this._oldFirstItemData = this._currentFirstItemData;
  }

  componentDidMount() {
    this._masonry = ReactDOM.findDOMNode(this);
    this._masonry.firstChild.scrollIntoView(false);
    this._masonry.addEventListener('scroll', this._onScroll);
    window.addEventListener('resize', this._onResize);
  }

  componentWillUnmount() {
    this._masonry.removeEventListener('scroll', this._onScroll);
    window.removeEventListener('resize', this._onResize);
  }

  onChildrenChangeHeight(itemId: string, newHeight: number) {
    this._updateItemsPositionWhenItemChangedHeight(itemId, newHeight);
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

    const {scrollTop} = this.state;

    // array item is rendered in the batch.
    const children = [];

    // number of items in viewport + overscan top + overscan bottom.
    const itemsInBatch = this._getItemsFromOffset(scrollTop);

    this._updateItemsPosition();



    // console.log(this._positionMaps);
    for (let i = 0; i <= itemsInBatch.length - 1; i++) {
      const index = this._getIndexFromId(itemsInBatch[i]);
      switch (typeof data[index]) {
        case "object": {
          const mess = new Message({
            id: data[index].itemId,
            userAvatarUrl: data[index].picture.thumbnail,
            userName: index + " " + data[index].name.first,
            messageContent: ListMessageExample[20],
            sentTime: data[index].registered.date
          });

          const cellMeasurer = new CellMeasurer({
            cache: cellMeasurerCache,
            id: PREFIX + mess.getItemId,
            position: {top: this._positionMaps.get(itemsInBatch[i]), left: 0},
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
                       sentTime={mess.getSentTime}
                       isMine={index % 2 === 0}
                       onChangedHeight={this.onChildrenChangeHeight}/>
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

  componentDidUpdate() {
    if(this._isJustLoadMoreTop()) {
      this._scrollToItem(this._oldFirstItemData, this.state.scrollTop);
      this._oldFirstItemData = this._currentFirstItemData;
    }
  }

  _onScroll() {
    this.setState({scrollTop: this._masonry.scrollTop});
    // this.forceUpdate();
    // console.log(document.getElementById(this.props.id).scrollTop);
  }

  _onResize() {
    //TODO: resize make viewport jumps to old position, NOT jumps to old item's position
    clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(function () {
      console.log('stopped');
    }, 1000);
    const {scrollTop} = this.state;
    const itemId = this._getItemIdFromPosition(scrollTop);
    const disparity = scrollTop - this._positionMaps.get(itemId);

    this._calculateItemsPositionFromSpecifiedItem(itemId);
    this._scrollToItem(itemId, disparity);
  }

  _getOldScrollTop(): number {
    return this._oldScrollTop;
  }

  _setOldScrollTop(currentScrollTop) {
    this._oldScrollTop = currentScrollTop;
  }

  // @UNSAFE: cellHeight is not updated.
  /*
   *  Get total height in estimation.
   */
  _getEstimatedTotalHeight(): number {
    const {data, cellMeasurerCache} = this.props;

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
  _setItemOnMap(itemId: string, height: number) {
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
  _setItemPositionOnMap(itemId: string, positionTop: number) {
    this._positionMaps.set(itemId, positionTop);
  }

  /*
   *  Update all items' position
   */
  _updateItemsPosition() {
    const {data, cellMeasurerCache: {defaultHeight}} = this.props;
    let currentPosition = 0;
    data.forEach((item) => {
      this._setItemPositionOnMap(PREFIX + item.itemId, currentPosition);
      if (this._renderedCellMaps.has(PREFIX + item.itemId)) {
        currentPosition += this._renderedCellMaps.get(PREFIX + item.itemId);
      } else {
        currentPosition += defaultHeight;
      }
    });
  }

  /*
   *  Update other items' position below the item that changed height.
   */
  _updateItemsPositionWhenItemChangedHeight(itemId: string, newHeight: number) {
    this._setItemOnMap(itemId, newHeight);
    this._calculateItemsPositionFromSpecifiedItem(itemId);
  }

  /*
   *  Calculate items' position from specified item to end the data list => reduces number of calculation
   */
  _calculateItemsPositionFromSpecifiedItem(itemId: string) {
    const {data} = this.props;
    // console.log('-----------------------');
    let currentItemId = itemId;
    const currentIndex = this._getIndexFromId(itemId);

    for (let i = currentIndex; i < data.length; i++) {
      const currentItemPosition = this._positionMaps.get(currentItemId);
      let currentItemHeight = this._renderedCellMaps.get(currentItemId);
      const followingItemId = this._getItemIdFromIndex(i + 1);
      // console.log('id: ' + currentItemId + ' pos: ' + currentItemPosition + " h: " + currentItemHeight + ' fol: ' + followingItemId);
      if (followingItemId !== OUT_OF_RANGE) {
        this._setItemPositionOnMap(followingItemId, currentItemPosition + currentItemHeight);
        currentItemId = followingItemId;
      }
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
        positionTop < this._positionMaps.get(key) + this._renderedCellMaps.get(key)) {
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
    const {data} = this.props;
    // only for props.data
    if (data) {
      const results = data.filter((item) => {
        return PREFIX + item.itemId === itemId
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
    const {data} = this.props;
    const maps = new Map();

    if (index >= data.length || index < 0) return OUT_OF_RANGE;

    for (let i = 0; i <= data.length - 1; i++) {
      maps.set(i, PREFIX + data[i].itemId);
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
    const {height, preRenderCellCount, cellMeasurerCache: {defaultHeight}, data} = this.props;
    const overscanOnPixel = defaultHeight * preRenderCellCount;

    let results: Array<string> = [];
    // console.log(scrollTop);
    const itemId = this._getItemIdFromPosition(scrollTop);

    const currentIndex = this._getIndexFromId(itemId);
    const numOfItemInViewport = this._getItemsInViewport(scrollTop, height).length;

    // Top: số lượng item trên top < preRenderCellCount
    if (scrollTop < overscanOnPixel) {
      if (numOfItemInViewport + 2 * preRenderCellCount >= data.length) {
        for (let i = 0; i <= data.length - 1; i++) {
          results.push(PREFIX + data[i].itemId);
        }
      } else {
        for (let i = 0; i <= numOfItemInViewport + 2 * preRenderCellCount; i++) {
          results.push(PREFIX + data[i].itemId);
        }
      }
    }

    // Bottom: số lượng item dưới < preRenderCellCount
    else if (scrollTop > this._getEstimatedTotalHeight() - height - overscanOnPixel) {
      for (let i = Math.max(0, currentIndex - preRenderCellCount); i < data.length; i++) {
        results.push(PREFIX + data[i].itemId);
      }
    }

    // Middle
    else {
      if (currentIndex + numOfItemInViewport + preRenderCellCount >= data.length) {
        for (let i = Math.max(0, currentIndex - preRenderCellCount); i < data.length; i++) {
          results.push(PREFIX + data[i].itemId);
        }
      } else {
        for (let i = Math.max(0, currentIndex - preRenderCellCount);
             i <= currentIndex + numOfItemInViewport + preRenderCellCount;
             i++) {
          results.push(PREFIX + data[i].itemId);
        }
      }
    }

    return results;
  }

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
    const results = new Array(0);

    if (itemIdStart !== NOT_FOUND) {
      results.push(itemIdStart);

      // disparity > 0 when scrollTop position is between `the item's position` and `item's position + its height`.
      const disparity = scrollTop - this._positionMaps.get(itemIdStart);
      let temp = height - this._renderedCellMaps.get(itemIdStart) + disparity;
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

  _scrollToItem(itemId: string, disparity) {
    if (this._positionMaps.has(itemId)) {
      this.scrollToOffset(this._positionMaps.get(itemId) + disparity);
    }
  }

  _isJustLoadMoreTop() {
    if (this._currentFirstItemData !== PREFIX + this.props.data[0].itemId) {
      this._currentFirstItemData = PREFIX + this.props.data[0].itemId;
      return true;
    }
    return false;
  }
}

export default Masonry;