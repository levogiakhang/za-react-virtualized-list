// @flow

import React from 'react';
import './Masonry.css';
import CellMeasurerCache from "../CellMeasurer/CellMeasurerCache";
import CellMeasurer from "../CellMeasurer/CellMeasurer";
import Message from "../Message/Message";
import {DEBOUNCING_TIMER, DEFAULT_HEIGHT, NOT_FOUND, OUT_OF_RANGE} from "../utils/value";
import debounce from "../utils/debounce";
import CellMeasurerModel from "../Model/CellMeasurerModel";
import MessageModel from "../Model/MessageModel";

type Props = {
  className?: string,
  id?: ?string,
  style?: mixed,
  height: number,
  numOfOverscan: number,
  data: any,
  cellMeasurerCache: CellMeasurerCache,
  loadMoreTopFunc?: any,
  loadMoreBottomFunc?: any,
  isStartAtBottom?: boolean,
  hideScrollToBottomBtn?: boolean
};

const LOAD_MORE_TOP_TRIGGER_POS = 200;
let LOAD_MORE_BOTTOM_TRIGGER_POS = 0;

class Masonry extends React.Component<Props> {
  static defaultProps = {
    height: 500,
    style: {marginTop: "10px", borderRadius: '5px'},
    id: 'Masonry',
    data: [],
    cellMeasurerCache: new CellMeasurerCache({defaultHeight: DEFAULT_HEIGHT}),
    numOfOverscan: 3,
    isStartAtBottom: false,
    hideScrollToBottomBtn: false,
  };

  constructor(props) {
    super(props);

    this.cache = props.cellMeasurerCache;

    this.state = {
      isScrolling: false,
      scrollTop: 0,
    };

    /* Scroll to bottom when the first loading */
    // Count number of render called.
    this.firstLoadingCount = 0;
    // Trigger is the first loading.
    this.isFirstLoading = true;
    this.isLoadingTop = false;
    this.isLoadingBottom = false;
    this.preventLoadBottom = true;

    this.isDebut = false;
    this.flat = undefined;
    this.firstItemInViewportBeforeDebut = {};

    // for add more above
    this.firstItemInViewport = {};
    this.oldDataLength = undefined;
    this.oldFirstItem = undefined;
    this.oldLastItem = undefined;
    this.oldLastItemBeforeDebut = undefined;

    this.estimateTotalHeight = undefined;

    this.resizeMap = {};
    this.isResize = false;

    // A map stores `index -> itemId`
    this.__indexMap__ = new Map();

    // A map stores `itemId -> {index, height, position}`
    this.__itemsMap__ = new Map();

    this.__renderedItems__ = new Map();

    // Represents this element.
    this.masonry = undefined;
    this.btnScrollBottomPos = {
      top: 0,
      right: 20,
    };

    this._onScroll = this._onScroll.bind(this);
    this._onResize = this._onResize.bind(this);
    this.onChildrenChangeHeight = this.onChildrenChangeHeight.bind(this);
    this.onRemoveItem = this.onRemoveItem.bind(this);
    this.scrollToSpecialItem = this.scrollToSpecialItem.bind(this);
    this._updateMapOnAddData = this._updateMapOnAddData.bind(this);
    this.scrollToBottom = this.scrollToBottom.bind(this);
    this.init();
  }

  init() {
    const {data, cellMeasurerCache: {defaultHeight}} = this.props;
    this._updateOldData();
    if (Array.isArray(data)) {
      data.forEach((item) => {
        this._updateItemOnMap(item.itemId, data.indexOf(item), defaultHeight, 0);
      });
      this._updateMapIndex(0, data.length);
    } else {
      console.error("Data list is not an array");
    }
    if (defaultHeight === undefined) {
      this.cache = new CellMeasurerCache({defaultHeight: DEFAULT_HEIGHT});
    }
    this.grandRef = React.createRef();
  }

  componentDidMount() {
    const {data, height} = this.props;
    this.masonry = this.grandRef.current.firstChild;
    window.addEventListener('resize', debounce(this._onResize, DEBOUNCING_TIMER));
    if (this.grandRef !== undefined) {
      this.btnScrollBottomPos.top = this.grandRef.current.offsetTop + height - 50;
    }
    console.log(data);
    this._updateItemsPosition();
    console.log(this.__itemsMap__);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._onResize);
  }

  onChildrenChangeHeight(itemId: string, newHeight: number) {
    if (this._getHeight(itemId) !== newHeight) {
      const curItem = this.firstItemInViewport.itemId;
      const dis = this.firstItemInViewport.disparity;
      if (!this.isFirstLoading && !this._isItemRendered(itemId)) {
        this.firstItemInViewportBeforeDebut = {curItem, dis};
        this.flat = this._getIndex(this.oldLastItemBeforeDebut) >= this._getIndex(itemId);
        this.isDebut = true;
      }
      this._updateRenderedItem(itemId, newHeight);
      this._updateItemsOnChangedHeight(itemId, newHeight);
      this.setState(this.state); // instead of this.forceUpdate();
    }
  }

  onRemoveItem(itemId: string) {
    const {data} = this.props;
    const itemIndex = this._getIndex(itemId);

    // remove an item means this item has new height equals 0
    this._updateItemsOnChangedHeight(itemId, 0);

    // Remove item on data list, rendered maps and position maps
    data.splice(itemIndex, 1);

    // Update index to id map after remove an item.
    this._updateMapIndex(itemIndex - 1, data.length);
    this.__indexMap__.delete(data.length);

    // Update the map
    this._updateItemIndex(itemIndex);
    this.__itemsMap__.delete(itemId);

    this.__renderedItems__.delete(itemId);

    this.forceUpdate();
  }

  scrollToSpecialItem(itemId: string) {
    if (this._isItemRendered(itemId)) {
      this._scrollToItem(itemId, 0);
    } else {
      // waiting for rendering already
      this._scrollToItem(itemId, 0);
    }
  };

  scrollToBottom() {
    this.preventLoadBottom = true;
    this._scrollToItem(this.oldLastItem);
  };

  render() {
    const {
      className,
      id,
      height,
      style,
      isScrolling,
      data,
      cellMeasurerCache,
      loadMoreTopFunc,
      loadMoreBottomFunc,
      isStartAtBottom
    } = this.props;

    const {scrollTop} = this.state;

    this.estimateTotalHeight = this._getEstimatedTotalHeight();

    if (!this.isResize) {
      this.resizeMap = {
        itemId: this.firstItemInViewport.itemId,
        disparity: this.firstItemInViewport.disparity
      };
    }
    // trigger load more top
    if (
      scrollTop < LOAD_MORE_TOP_TRIGGER_POS &&
      !this.isFirstLoading &&
      !this.isLoadingTop
    ) {
      if (typeof loadMoreTopFunc === 'function') {
        this.isLoadingTop = true;
        loadMoreTopFunc();
      } else {
        console.warn("loadMoreTopFunc callback is not a function")
      }
      console.log('============load top===============');
    }

    // trigger load more bottom
    LOAD_MORE_BOTTOM_TRIGGER_POS = this.estimateTotalHeight - height - 2;
    if (
      scrollTop >= LOAD_MORE_BOTTOM_TRIGGER_POS &&
      !this.isFirstLoading &&
      !this.isLoadingBottom &&
      !this.preventLoadBottom
    ) {
      if (typeof loadMoreBottomFunc === 'function') {
        this.isLoadingBottom = true;
        loadMoreBottomFunc();
      } else {
        console.warn("loadMoreBottomFunc callback is not a function")
      }
    }

    this._updateMapOnAddData();

    const curItem = this._getItemIdFromPosition(scrollTop);
    this.firstItemInViewport = {
      itemId: curItem,
      disparity: scrollTop - this._getPosition(curItem)
    };

    // number of items in viewport + overscan top + overscan bottom.
    const itemsInBatch = this._getItemsInBatch(scrollTop);

    if (isStartAtBottom) {
      this._scrollToBottomAtFirst(itemsInBatch);
    } else {
      this.isFirstLoading = false;
    }

    // array item is rendered in the batch.
    const children = [];
    for (let i = 0; i <= itemsInBatch.length - 1; i++) {
      const index = this._getIndex(itemsInBatch[i]);
      switch (typeof data[index]) {
        case "object": {
          const mess = new MessageModel({
            id: data[index].itemId,
            userAvatarUrl: data[index].avatar,
            userName: data[index].userName,
            messageContent: data[index].msgContent,
            sentTime: data[index].timestamp,
            isMine: false,
            onRemoveItem: this.onRemoveItem,
          });

          const cellMeasurer = new CellMeasurerModel({
            id: data[index].itemId,
            cache: cellMeasurerCache,
            position: {top: this._getPosition(itemsInBatch[i]), left: 0},
          });

          children.push(
            <CellMeasurer id={cellMeasurer.getItemId()}
                          key={cellMeasurer.getItemId()}
                          cache={cellMeasurer.getCache}
                          onChangedHeight={this.onChildrenChangeHeight}
                          position={cellMeasurer.getPosition}>
              <Message id={mess.getItemId()}
                       key={mess.getItemId()}
                       index={index}
                       userAvatarUrl={mess.getUserAvatarUrl}
                       userName={mess.getUserName}
                       messageContent={mess.getMessageContent}
                       sentTime={mess.getSentTime}
                       isMine={mess.isMine}
                       onRemoveItem={mess.onRemoveCallBack}/>
            </CellMeasurer>
          );
          break;
        }

        default: {
          break;
        }
      }
    }

    return (
      <div ref={this.grandRef}>
        <div className={className}
             id={id}
             onScroll={this._onScroll}
             style={{
               backgroundColor: 'cornflowerblue',
               boxSizing: 'border-box',
               overflowX: 'hidden',
               overflowY: this.estimateTotalHeight < height ? 'hidden' : 'auto',
               width: 'auto',
               minWidth: '550px',
               minHeight: '500px',
               height: height,
               position: 'relative',
               willChange: 'auto',
               ...style
             }}>
          <div className="innerScrollContainer"
               style={{
                 width: '100%',
                 height: this.estimateTotalHeight,
                 maxWidth: '100%',
                 maxHeight: this.estimateTotalHeight,
                 overflow: 'hidden',
                 position: 'relative',
                 pointerEvents: isScrolling ? 'none' : '', // property defines whether or not an element reacts to pointer events.
               }}>
            {children}
          </div>
        </div>
        {
          scrollTop <= this.estimateTotalHeight - height - 200 ? <button
            className={'btn-scroll-bottom'}
            onClick={this.scrollToBottom}
            style={{
              position: 'absolute',
              right: this.btnScrollBottomPos.right,
              top: this.btnScrollBottomPos.top
            }}>
            <i className={'down'}/>
          </button> : null
        }
      </div>
    );
  }

  componentDidUpdate() {
    const {data, height} = this.props;
    const {scrollTop} = this.state;

    if (scrollTop > LOAD_MORE_TOP_TRIGGER_POS && this.isLoadingTop) {
      this.isLoadingTop = false;
    }

    if (scrollTop >= LOAD_MORE_BOTTOM_TRIGGER_POS && this.isLoadingBottom) {
      this.isLoadingBottom = false;
    }

    if (scrollTop < this.estimateTotalHeight - height - 200 && !this.isFirstLoading) {
      this.preventLoadBottom = false;
    }

    if (this.isDebut && !this.isLoadingTop) {
      this.posNeedToScr = this._getPosition(this.firstItemInViewportBeforeDebut.curItem) + this.firstItemInViewportBeforeDebut.dis;
      this.isDebut = false;
      this._scrollToOffset(this.posNeedToScr);
    }

    // check add or remove item above
    // remove
    if (this.oldDataLength !== data.length) {
      this._updateOldData();
      // this._scrollToItem(
      //   this.firstItemInViewport.itemId,
      //   this.firstItemInViewport.disparity
      // );
    }
  }

  /*
   * Scroll to bottom when the first loading
   */
  _scrollToBottomAtFirst(itemsInBatch) {
    const {data} = this.props;
    if (
      this.masonry !== undefined &&
      this.isFirstLoading === true &&
      !!data.length
    ) {
      this.firstLoadingCount++;
      const lastItemId = this._getItemIdFromIndex(data.length - 1);
      this._scrollToItem(lastItemId, this._getHeight(lastItemId));
      if (this.firstLoadingCount >= itemsInBatch.length + 8) {
        console.log('reverse done');
        this.isFirstLoading = false;
      }
    }
  }

  _updateMapOnAddData() {
    const {data} = this.props;
    if (this.oldDataLength < data.length) {
      // update rendered maps when data has added more.
      data.forEach((item) => {
        if (!this._hasItem(item.itemId)) {
          this._updateItemOnMap(item.itemId, data.indexOf(item), this.cache.defaultHeight, 0);
        }
      });
      this._updateMapIndex(0, data.length);
      this._updateItemsPosition();
      console.log(this.firstItemInViewport.itemId, this.firstItemInViewport.disparity);
      this._scrollToItem(this.firstItemInViewport.itemId, this.firstItemInViewport.disparity)
    }
  }

  _onScroll() {
    const {height} = this.props;
    if (this.flat) {
      this.masonry.scrollTop = this.posNeedToScr;
      this.flat = false;
    }
    const eventScrollTop = this.masonry.scrollTop;
    const scrollTop = Math.min(
      Math.max(0, this.estimateTotalHeight - height),
      eventScrollTop
    );

    if (Math.round(eventScrollTop) !== Math.round(scrollTop)) return;

    if (this.state.scrollTop !== scrollTop) {
      this.setState({scrollTop});
    }
  };

  _onResize() {
    console.log('resize');
    this.isResize = true;
    console.log(this.resizeMap.itemId, this.resizeMap.disparity);
    this._scrollToOffset(1000);
    this.isResize = false;
  }

  _scrollToOffset(top) {
    this.masonry.scrollTo(0, top);
  }

  /*
   *  Get total height in estimation.
   */
  _getEstimatedTotalHeight(): number {
    const {data} = this.props;
    let totalHeight = 0;

    if (!!data.length) {
      // total height = sigma (rendered items) + non-rendered items * default height.
      for (let key of this.__renderedItems__.keys()) {
        totalHeight += this._getRealHeight(key);
      }
      totalHeight += this.cache.defaultHeight * (data.length - this.__renderedItems__.size);
    }

    return totalHeight;
  }

  _updateOldData() {
    const {data} = this.props;
    if (!!data.length) {
      this.oldDataLength = data.length;
      if (!!data[0]) {
        this.oldFirstItem = data[0].itemId;
      }
      if (!!data[data.length - 1]) {
        this.oldLastItem = data[data.length - 1].itemId;
      }
    }
  }

  _updateItemOnMap(itemId: string, itemIndex: number, itemHeight: number, itemPosition: number) {
    this.__itemsMap__.set(itemId, {index: itemIndex, height: itemHeight, position: itemPosition});
  }

  _updateMapIndex(startIndex: number, endIndex: number) {
    const {data} = this.props;
    if (!!data.length) {
      if (endIndex >= data.length) endIndex = data.length - 1;
      if (startIndex < 0) startIndex = 0;
      for (let i = startIndex; i <= endIndex; i++) {
        this.__indexMap__.set(i, data[i].itemId);
      }
    }
  }

  _updateRenderedItem(itemId: string, realHeight: number) {
    this.__renderedItems__.set(itemId, realHeight);
  }

  _updateItemIndex(startIndex: number) {
    const {data} = this.props;
    if (!!data.length) {
      let itemId;
      for (let i = startIndex; i <= data.length - 1; i++) {
        itemId = this._getItemIdFromIndex(i);
        this._updateItemOnMap(itemId, i, this._getHeight(itemId), this._getPosition(itemId));
      }
    }
  }

  /*
   *  Update all items' position
   */
  _updateItemsPosition() {
    const {data} = this.props;
    if (Array.isArray(data)) {
      let currentPosition = 0;
      data.forEach((item) => {
        this._updateItemOnMap(item.itemId,
          data.indexOf(item),
          this._getHeight(item.itemId),
          currentPosition);
        currentPosition += this._getHeight(item.itemId);
      });
    }
  }

  /*
   *  Update other items' position below the item that changed height.
   */
  _updateItemsOnChangedHeight(itemId: string, newHeight: number) {
    this._updateItemOnMap(itemId,
      this._getIndex(itemId),
      newHeight,
      this._getPosition(itemId));
    this._updateItemsPositionFromSpecifiedItem(itemId);
  }

  /*
   *  Calculate items' position from specified item to end the data list => reduces number of calculation
   */
  _updateItemsPositionFromSpecifiedItem(itemId: string) {
    const {data} = this.props;
    if (!!data.length) {
      // console.log('-----------------------');
      let currentItemId = itemId;
      const currentIndex = this._getIndex(itemId);

      // TODO: High cost
      for (let i = currentIndex; i < data.length; i++) {
        const currentItemPosition = this._getPosition(currentItemId);
        let currentItemHeight = this._getHeight(currentItemId);
        const followingItemId = this._getItemIdFromIndex(i + 1);
        if (followingItemId !== OUT_OF_RANGE) {
          this._updateItemOnMap(followingItemId,
            this._getIndex(followingItemId),
            this._getHeight(followingItemId),
            currentItemPosition + currentItemHeight);
          currentItemId = followingItemId;
        }
      }
    }
  }

  _hasItem(itemId: string): boolean {
    return this.__itemsMap__.has(itemId);
  }

  _isItemRendered(itemId: string): boolean {
    return this.__renderedItems__.has(itemId);
  }

  _getIndex(itemId: string): number {
    return this.__itemsMap__.has(itemId) ? this.__itemsMap__.get(itemId).index : NOT_FOUND
  }

  _getHeight(itemId: string): number {
    return this.__itemsMap__.has(itemId) ? this.__itemsMap__.get(itemId).height : NOT_FOUND
  }

  _getPosition(itemId: string): number {
    return this.__itemsMap__.has(itemId) ? this.__itemsMap__.get(itemId).position : NOT_FOUND
  }

  _getRealHeight(itemId: string) {
    return this.__renderedItems__.has(itemId) ? this.__renderedItems__.get(itemId) : NOT_FOUND
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
    const {data} = this.props;
    if (!!data.length) {
      if (positionTop >= this._getEstimatedTotalHeight()) return this._getItemIdFromIndex(data.length - 1);

      for (let key of this.__itemsMap__.keys()) {
        if (positionTop >= this._getPosition(key) &&
          positionTop < this._getPosition(key) + this._getHeight(key)) {
          return key;
        }
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
    if (!!data.length) {
      if (index >= data.length || index < 0) return OUT_OF_RANGE;
      return this.__indexMap__.get(index);
    }
  }

  /*
   *  Return an array that stores itemId of items rendering in batch
   *  @param:
   *      scrollTop: offset top of Masonry
   *  @return: an Array<string>
   */
  _getItemsInBatch(scrollTop: number): Array<string> {
    const {height, numOfOverscan, data} = this.props;
    let results: Array<string> = [];

    if (!!data.length) {
      const currentIndex = this._getIndex(this._getItemIdFromPosition(scrollTop));
      const numOfItemInViewport = this._getItemsInViewport(scrollTop, height).length;
      const startIndex = Math.max(0, currentIndex - numOfOverscan);
      const endIndex = Math.min(currentIndex + numOfItemInViewport + numOfOverscan, data.length);

      for (let i = startIndex; i < endIndex; i++) {
        results.push(data[i].itemId);
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
  _getItemsInViewport(scrollTop: number, viewportHeight: number): Array<string> {
    const {data} = this.props;
    const results = [];

    if (!!data.length) {
      const itemIdStart = this._getItemIdFromPosition(scrollTop);
      if (itemIdStart !== NOT_FOUND) {
        results.push(itemIdStart);

        // disparity > 0 when scrollTop position is between `the item's position` and `item's position + its height`.
        const disparity = scrollTop - this._getPosition(itemIdStart);
        let remainingViewHeight = viewportHeight - this._getHeight(itemIdStart) + disparity;

        let i = 1;
        let itemIndex = this._getIndex(itemIdStart);
        if (itemIndex + i >= data.length) {
          itemIndex = data.length - 2;
        }

        let nextItemId = this._getItemIdFromIndex(itemIndex + i);
        let nextItemHeight = this._getHeight(nextItemId);

        while (remainingViewHeight > nextItemHeight) {
          remainingViewHeight -= nextItemHeight;
          results.push(nextItemId);
          i++;
          nextItemId = this._getItemIdFromIndex(itemIndex + i);
          if (nextItemId !== OUT_OF_RANGE) {
            nextItemHeight = this._getHeight(nextItemId);
          }
        }
        if (remainingViewHeight > 0) {
          results.push(nextItemId);
        }
      }
    }

    return results;
  }

  _scrollToItem(itemId: string, disparity = 0) {
    if (this._hasItem(itemId)) {
      this._scrollToOffset(this._getPosition(itemId) + disparity);
    }
  }
}

export default Masonry;