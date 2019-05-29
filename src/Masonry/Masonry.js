// @flow

import React from 'react';
import CellMeasurerCache from "../CellMeasurer/CellMeasurerCache";
import CellMeasurer from "../CellMeasurer/CellMeasurer";
import * as ReactDOM from "react-dom";
import Message from "../Message/Message";
import {NOT_FOUND, OUT_OF_RANGE, PREFIX} from "../utils/value";

type Props = {
  className?: string,
  id?: ?string,
  style?: mixed,
  height: number,
  preRenderCellCount: number,
  data: any,
  cellMeasurerCache: CellMeasurerCache,
};

const CURRENT_ITEM_IN_VIEWPORT = 'currentItemInViewport';

class Masonry extends React.Component<Props> {
  constructor(props) {
    super(props);

    this.state = {
      isScrolling: false,
      scrollTop: 0,
    };

    // for add more above
    this._currentItemInViewport = new Map();
    this._oldDataLength = undefined;

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
    this._updateItemsPositionFromSpecifiedItem = this._updateItemsPositionFromSpecifiedItem.bind(this);
    this.onRemoveItem = this.onRemoveItem.bind(this);

    const {data, cellMeasurerCache} = this.props;
    data.forEach((item) => {
      this._setItemOnMap(PREFIX + item.itemId, cellMeasurerCache.defaultHeight);
    });
  }

  componentDidMount() {
    this._masonry = ReactDOM.findDOMNode(this);
    this._masonry.firstChild.scrollIntoView(false);
    this._masonry.addEventListener('scroll', this._onScroll);
    window.addEventListener('resize', this._onResize);
    this._oldDataLength = this.props.data.length;
    console.log(this.props.data);
    this._updateItemsPosition();
  }

  componentWillUnmount() {
    this._masonry.removeEventListener('scroll', this._onScroll);
    window.removeEventListener('resize', this._onResize);
  }

  onChildrenChangeHeight(itemId: string, newHeight: number) {
    console.log(this._currentItemInViewport.get(CURRENT_ITEM_IN_VIEWPORT).itemId);
    console.log(this._getItemIdFromPosition(this.state.scrollTop));
    const disparity = this.state.scrollTop - this._positionMaps.get(this._getItemIdFromPosition(this.state.scrollTop));
    console.log(disparity);
    this._updateItemsPositionWhenItemChangedHeight(itemId, newHeight);
    this._scrollToItem(this._currentItemInViewport.get(CURRENT_ITEM_IN_VIEWPORT).itemId, disparity);
    console.log('scr');
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

    this._currentItemInViewport.set(CURRENT_ITEM_IN_VIEWPORT, {
      itemId: this._getItemIdFromPosition(scrollTop),
      disparity: scrollTop - this._positionMaps.get(this._getItemIdFromPosition(scrollTop))
    });

    if (this._oldDataLength < data.length) {
      // update rendered maps when data has added more.
      data.forEach((item) => {
        if (!this._renderedCellMaps.has(PREFIX + item.itemId)) {
          this._setItemOnMap(PREFIX + item.itemId, cellMeasurerCache.defaultHeight);
        }
      });
      this._updateItemsPosition();
    }

    // array item is rendered in the batch.
    const children = [];
    console.log(this._currentItemInViewport);

    // number of items in viewport + overscan top + overscan bottom.
    const itemsInBatch = this._getItemsFromOffset(scrollTop);

    for (let i = 0; i <= itemsInBatch.length - 1; i++) {
      const index = this._getIndexFromId(itemsInBatch[i]);
      switch (typeof data[index]) {
        case "object": {
          const mess = new Message({
            id: data[index].itemId,
            userAvatarUrl: data[index].picture.thumbnail,
            userName: index + " " + data[index].name.first,
            messageContent: data[index].itemId + ', ' + data[index].itemId + ', ' + data[index].itemId + ', ' + data[index].itemId + data[index].itemId + data[index].itemId,
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
                          onChangedHeight={this.onChildrenChangeHeight}
                          position={cellMeasurer.getCellPosition}>
              <Message id={mess.getItemId}
                       key={mess.getItemId}
                       userAvatarUrl={mess.getUserAvatarUrl}
                       userName={mess.getUserName}
                       messageContent={mess.getMessageContent}
                       sentTime={mess.getSentTime}
                       isMine={false}
                       onRemoveItem={this.onRemoveItem}/>
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
             minWidth: '550px',
             minHeight: '500px',
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
    const {data} = this.props;

    // check add or remove item above
    // remove
    if (this._oldDataLength !== data.length) {
      this._oldDataLength = data.length;
      this._scrollToItem(this._currentItemInViewport.get(CURRENT_ITEM_IN_VIEWPORT).itemId, this._currentItemInViewport.get(CURRENT_ITEM_IN_VIEWPORT).disparity);
    }
  }

  _onScroll() {
    this.setState({scrollTop: this._masonry.scrollTop});
  }

  _onResize() {
    //TODO: resize make viewport jumps to old position, NOT jumps to old item's position
    clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(function () {
      // console.log('stopped');
    }, 1000);
    const {scrollTop} = this.state;
    // console.log('s1: ' + scrollTop);
    this._currentItemInViewport.set(CURRENT_ITEM_IN_VIEWPORT, {
      itemId: this._getItemIdFromPosition(scrollTop),
      disparity: scrollTop - this._positionMaps.get(this._getItemIdFromPosition(scrollTop))
    });

    // console.log('id: ' + (this._currentItemInViewport.get(CURRENT_ITEM_IN_VIEWPORT).itemId));
    // console.log('pos: ' + this._positionMaps.get(this._currentItemInViewport.get(CURRENT_ITEM_IN_VIEWPORT).itemId));
    // console.log('dis: ' + this._currentItemInViewport.get(CURRENT_ITEM_IN_VIEWPORT).disparity);
    this._scrollToItem(this._currentItemInViewport.get(CURRENT_ITEM_IN_VIEWPORT).itemId, this._currentItemInViewport.get(CURRENT_ITEM_IN_VIEWPORT).disparity);
    // console.log('s2: ' + scrollTop);
  }

  // @UNSAFE: cellHeight is not updated.
  /*
   *  Get total height in estimation.
   */
  _getEstimatedTotalHeight(): number {
    const {data, cellMeasurerCache: {defaultHeight}} = this.props;

    if (!this._renderedCellMaps || this._renderedCellMaps.size === 0) {
      return data.length * defaultHeight;
    }

    let totalHeight = 0;

    data.forEach((item) => {
      if (this._renderedCellMaps.has(PREFIX + item.itemId)) {
        totalHeight += Math.round(this._renderedCellMaps.get(PREFIX + item.itemId));
      } else {
        totalHeight += defaultHeight;
      }
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

  onRemoveItem(itemId: string) {
    const itemIndex = this._getIndexFromId(itemId);

    // remove an item means this item has new height equals 0
    this._updateItemsPositionWhenItemChangedHeight(itemId, 0);

    // Remove item on data list, rendered maps and position maps
    this.props.data.splice(itemIndex, 1);
    this._renderedCellMaps.delete(itemId);
    this._positionMaps.delete(itemId);

    this.forceUpdate();
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
    this._updateItemsPositionFromSpecifiedItem(itemId);
  }

  /*
   *  Calculate items' position from specified item to end the data list => reduces number of calculation
   */
  _updateItemsPositionFromSpecifiedItem(itemId: string) {
    const {data} = this.props;
    // console.log('-----------------------');
    let currentItemId = itemId;
    const currentIndex = this._getIndexFromId(itemId);

    // TODO: High cost
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
 *        + OUT_OF_RANGE ('out of range'): if position param is greater than total height.
 */
  _getItemIdFromPosition(positionTop: number): string {
    if (positionTop >= this._getEstimatedTotalHeight()) return OUT_OF_RANGE;
    let cellHeight = undefined;
    for (let key of this._positionMaps.keys()) {
      if (!this._renderedCellMaps.has(key)) {
        cellHeight = this.props.cellMeasurerCache.defaultHeight;
      } else {
        cellHeight = this._renderedCellMaps.get(key);
      }

      if (positionTop >= this._positionMaps.get(key) &&
        positionTop < this._positionMaps.get(key) + cellHeight) {
        return key;
      }
    }
  }

  /*
 *  Get index of a item in data array by id
 *  @param:
 *        + itemId (string): identification of item. This id is unique for each item in array.
 *  @return:
 *        + (number): a value represents index of that item in the array. In case the result has more than one, return the first item.
 *        + NOT_FOUND (-1): if item isn't in the array.
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
    const overscanOnPixel = Math.min(defaultHeight * preRenderCellCount, this._positionMaps.get(this._getItemIdFromIndex(preRenderCellCount)));

    let results: Array<string> = [];
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
        for (let i = Math.max(0, currentIndex - preRenderCellCount); i <= numOfItemInViewport + preRenderCellCount; i++) {
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
}

export default Masonry;