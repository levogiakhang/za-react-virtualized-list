// @flow

import React from 'react';
import './Masonry.css';
import CellMeasurerCache from "../CellMeasurer/CellMeasurerCache";
import CellMeasurer from "../CellMeasurer/CellMeasurer";
import { DEBOUNCING_TIMER, DEFAULT_HEIGHT, NOT_FOUND, OUT_OF_RANGE } from "../utils/value";
import debounce from "../utils/debounce";
import CellMeasurerModel from "../Model/CellMeasurerModel";
import ItemCache from "../utils/ItemCache";

type Props = {
  className?: string,
  id?: ?string,
  style?: mixed,
  height: number,
  numOfOverscan: number,
  viewModel: any,
  cellRenderer: any,
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
    numOfOverscan: 3,
    isStartAtBottom: false,
    hideScrollToBottomBtn: false,
  };

  constructor(props) {
    super(props);

    this.viewModel = props.viewModel;

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
    this.preventLoadTop = true;
    this.preventLoadBottom = true;
    this.firstItemInViewportBeforeLoadTop = {};

    this.isDebut = false;
    this.flat = undefined;
    this.firstItemInViewportBeforeDebut = {};

    // for add more above
    this.firstItemInViewport = {};
    this.oldDataLength = undefined;
    this.oldFirstItem = undefined;
    this.oldLastItem = undefined;
    this.oldLastItemBeforeDebut = undefined;

    this.estimateTotalHeight = 0;

    this.resizeMap = {};
    this.isResize = false;

    this.itemCache = new ItemCache();

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
    this.scrollToTop = this.scrollToTop.bind(this);
    this.scrollToBottom = this.scrollToBottom.bind(this);
    this.init();
  }

  init() {
    const data = this.viewModel.getData;
    const defaultHeight = this.viewModel.getCellCache.defaultHeight;
    this._updateOldData();
    if (Array.isArray(data)) {
      data.forEach((item) => {
        this.itemCache.updateItemOnMap(item.itemId, data.indexOf(item), defaultHeight, 0);
      });
      this._updateMapIndex(0, data.length);
    } else {
      console.error("Data list is not an array");
    }
    if (defaultHeight === undefined) {
      this.cache = new CellMeasurerCache({defaultHeight: DEFAULT_HEIGHT});
    }
    this.parentRef = React.createRef();
  }

  componentDidMount() {
    const data = this.viewModel.getData;
    const {height} = this.props;
    this.masonry = this.parentRef.current.firstChild;
    window.addEventListener('resize', debounce(this._onResize, DEBOUNCING_TIMER));
    if (this.parentRef !== undefined) {
      this.btnScrollBottomPos.top = this.parentRef.current.offsetTop + height - 50;
    }
    console.log(data);
    this._updateItemsPosition();
    console.log(this.itemCache.getIndexMap);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._onResize);
  }

  onChildrenChangeHeight(itemId: string, newHeight: number) {
    if (this.itemCache.getHeight(itemId) !== newHeight) {
      const curItem = this.firstItemInViewport.itemId;
      const dis = this.firstItemInViewport.disparity;
      if (!this.isFirstLoading && !this.itemCache.isItemRendered(itemId)) {
        this.firstItemInViewportBeforeDebut = {curItem, dis};
        this.flat = this.itemCache.getIndex(this.oldLastItemBeforeDebut) >= this.itemCache.getIndex(itemId);
        this.isDebut = true;
      }
      this.itemCache.updateRenderedItem(itemId, newHeight);
      this._updateItemsOnChangedHeight(itemId, newHeight);
      this.estimateTotalHeight = this._getEstimatedTotalHeight();
      this.setState(this.state); // instead of this.forceUpdate();
    }
  }

  onAddItem(index, item) {
    this.viewModel.insertItem(index, item);
    this.estimateTotalHeight = this._getEstimatedTotalHeight();
  }

  onRemoveItem(itemId: string) {
    const data = this.viewModel.getData;
    const itemIndex = this.itemCache.getIndex(itemId);

    if (itemIndex !== NOT_FOUND) {
      // remove an item means this item has new height equals 0
      this._updateItemsOnChangedHeight(itemId, 0);

      // Remove item on data list, rendered maps and position maps
      this.viewModel.deleteItem(itemIndex);

      // Update index to id map after remove an item.
      this._updateMapIndex(itemIndex - 1, data.length);
      this.itemCache.getIndexMap.delete(data.length);

      // Update the map
      this._updateItemIndex(itemIndex);
      this.itemCache.deleteItem(itemId);

      this.estimateTotalHeight = this._getEstimatedTotalHeight();
      this._updateOldData();
    }
  }

  scrollToSpecialItem(itemId: string) {
    if (this.itemCache.isItemRendered(itemId)) {
      this._scrollToItem(itemId, 0);
    } else {
      // waiting for rendering already
      this._scrollToItem(itemId, 0);
    }
  };

  scrollToTop() {
    this.preventLoadTop = true;
    this._scrollToItem(this.oldFirstItem);
  };

  scrollToBottom() {
    this.preventLoadBottom = true;
    this._scrollToItem(this.oldLastItem);
  };

  reRender() {
    this.setState(this.state);
  }

  render() {
    const {
      className,
      id,
      height,
      style,
      isScrolling,
      isStartAtBottom,
      cellRenderer
    } = this.props;

    const data = this.viewModel.getData;
    const cellCache = this.viewModel.getCellCache;
    const {scrollTop} = this.state;
    const removeCallback = this.viewModel.onRemoveItem;

    const curItem = this._getItemIdFromPosition(scrollTop);
    this.firstItemInViewport = {
      itemId: curItem,
      disparity: scrollTop - this.itemCache.getPosition(curItem)
    };

    // trigger load more top
    if (
      scrollTop < LOAD_MORE_TOP_TRIGGER_POS &&
      !this.isFirstLoading &&
      !this.isLoadingTop &&
      !this.preventLoadTop
    ) {
      if (typeof this.viewModel.getLoadMoreTopCallBack === 'function') {
        this.isLoadingTop = true;
        this.firstItemInViewportBeforeLoadTop = {
          itemId: curItem,
          disparity: scrollTop - this.itemCache.getPosition(curItem)
        };
        this.viewModel.getLoadMoreTopCallBack();
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
      if (typeof this.viewModel.getLoadMoreBottomCallBack === 'function') {
        this.isLoadingBottom = true;
        this.viewModel.getLoadMoreBottomCallBack();
      } else {
        console.warn("loadMoreBottomFunc callback is not a function")
      }
    }

    this._updateMapOnAddData();

    // number of items in viewport + overscan top + overscan bottom.
    const itemsInBatch = this._getItemsInBatch(scrollTop);

    if (isStartAtBottom) {
      this._scrollToBottomAtFirst(itemsInBatch);
    } else {
      this.preventLoadTop = true;
      this.isFirstLoading = false;
    }

    // array item is rendered in the batch.
    const children = [];
    for (let i = 0; i <= itemsInBatch.length - 1; i++) {
      const index = this.itemCache.getIndex(itemsInBatch[i]);
      if (!!data[index]) {
        const cellMeasurer = new CellMeasurerModel({
          id: data[index].itemId,
          cache: cellCache,
          position: {top: this.itemCache.getPosition(itemsInBatch[i]), left: 0},
        });
        children.push(
          <CellMeasurer id={cellMeasurer.getItemId()}
                        key={cellMeasurer.getItemId()}
                        cache={cellMeasurer.getCache}
                        onChangedHeight={this.onChildrenChangeHeight}
                        position={cellMeasurer.getPosition}>
            {typeof cellRenderer === 'function' ? cellRenderer({index, data, removeCallback}) : null}
          </CellMeasurer>
        );
      }
    }

    return (
      <div className={'masonry-parent'}
           ref={this.parentRef}>
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
      </div>
    );
  }

  componentDidUpdate() {
    const data = this.viewModel.getData;
    const {height} = this.props;
    const {scrollTop} = this.state;

    if (scrollTop > LOAD_MORE_TOP_TRIGGER_POS) {
      this.preventLoadTop = false;
      if (this.isLoadingTop) {
        this.isLoadingTop = false;
      }
    }

    if (scrollTop >= LOAD_MORE_BOTTOM_TRIGGER_POS && this.isLoadingBottom) {
      this.isLoadingBottom = false;
    }

    if (scrollTop < this.estimateTotalHeight - height - 200 && !this.isFirstLoading) {
      this.preventLoadBottom = false;
    }

    if (this.isDebut && !this.isLoadingTop) {
      this.posNeedToScr = this.itemCache.getPosition(this.firstItemInViewportBeforeDebut.curItem) + this.firstItemInViewportBeforeDebut.dis;
      this.isDebut = false;
      this._scrollToOffset(this.posNeedToScr);
    }

    // check add or remove item above
    // remove
    if (this.oldDataLength !== data.length) {
      if(this.oldDataLength < data.length && this.isLoadingTop && !this.isDebut) {
        console.log(this.firstItemInViewportBeforeLoadTop);
        this._scrollToItem(
          this.firstItemInViewportBeforeLoadTop.itemId,
          this.firstItemInViewportBeforeLoadTop.disparity
        );
      }
      this._updateOldData();
    }
  }

  /*
   * Scroll to bottom when the first loading
   */
  _scrollToBottomAtFirst(itemsInBatch) {
    const data = this.viewModel.getData;
    if (
      this.masonry !== undefined &&
      this.isFirstLoading === true &&
      !!data.length
    ) {
      this.firstLoadingCount++;
      const lastItemId = this._getItemIdFromIndex(data.length - 1);
      this._scrollToItem(lastItemId, this.itemCache.getHeight(lastItemId));
      if (this.firstLoadingCount >= itemsInBatch.length + 8) {
        console.log('reverse done');
        this.isFirstLoading = false;
      }
    }
  }

  _updateMapOnAddData() {
    const data = this.viewModel.getData;
    if (this.oldDataLength < data.length) {
      // update rendered maps when data has added more.
      data.forEach((item) => {
        if (!this.itemCache.hasItem(item.itemId)) {
          this.itemCache.updateItemOnMap(item.itemId, data.indexOf(item), this.viewModel.getCellCache.defaultHeight, 0);
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
    //console.log(this.resizeMap.itemId, this.resizeMap.disparity);
    //this._scrollToOffset(1000);
    this.isResize = false;
  }

  _scrollToOffset(top) {
    this.masonry.scrollTo(0, top);
  }

  /*
   *  Get total height in estimation.
   */
  _getEstimatedTotalHeight(): number {
    const data = this.viewModel.getData;
    let totalHeight = 0;

    if (!!data.length) {
      // total height = sigma (rendered items) + non-rendered items * default height.
      for (let key of this.itemCache.getRenderedMap.keys()) {
        totalHeight += this.itemCache.getRealHeight(key);
      }
      totalHeight += this.viewModel.getCellCache.defaultHeight * (data.length - this.itemCache.getRenderedMap.size);
    }

    return totalHeight;
  }

  _updateOldData() {
    const data = this.viewModel.getData;
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

  _updateMapIndex(startIndex: number, endIndex: number) {
    const data = this.viewModel.getData;
    if (!!data.length) {
      if (endIndex >= data.length) endIndex = data.length - 1;
      if (startIndex < 0) startIndex = 0;
      for (let i = startIndex; i <= endIndex; i++) {
        this.itemCache.updateIndexMap(i, data[i].itemId);
      }
    }
  }

  _updateItemIndex(startIndex: number) {
    const data = this.viewModel.getData;
    if (!!data.length) {
      let itemId;
      for (let i = startIndex; i <= data.length - 1; i++) {
        itemId = this._getItemIdFromIndex(i);
        this.itemCache.updateItemOnMap(itemId, i, this.itemCache.getHeight(itemId), this.itemCache.getPosition(itemId));
      }
    }
  }

  /**
   *  Update all items' position
   */
  _updateItemsPosition() {
    const data = this.viewModel.getData;
    if (Array.isArray(data)) {
      let currentPosition = 0;
      data.forEach((item) => {
        this.itemCache.updateItemOnMap(item.itemId,
          data.indexOf(item),
          this.itemCache.getHeight(item.itemId),
          currentPosition);
        currentPosition += this.itemCache.getHeight(item.itemId);
      });
    }
  }

  /**
   *  Update other items' position below the item that changed height.
   */
  _updateItemsOnChangedHeight(itemId: string, newHeight: number) {
    this.itemCache.updateItemOnMap(itemId,
      this.itemCache.getIndex(itemId),
      newHeight,
      this.itemCache.getPosition(itemId));
    this._updateItemsPositionFromSpecifiedItem(itemId);
  }

  /**
   *  Calculate items' position from specified item to end the data list => reduces number of calculation
   */
  _updateItemsPositionFromSpecifiedItem(itemId: string) {
    const data = this.viewModel.getData;
    if (!!data.length) {
      // console.log('-----------------------');
      let currentItemId = itemId;
      const currentIndex = this.itemCache.getIndex(itemId);

      // TODO: High cost
      for (let i = currentIndex; i < data.length; i++) {
        const currentItemPosition = this.itemCache.getPosition(currentItemId);
        let currentItemHeight = this.itemCache.getHeight(currentItemId);
        const followingItemId = this._getItemIdFromIndex(i + 1);
        if (followingItemId !== OUT_OF_RANGE) {
          this.itemCache.updateItemOnMap(followingItemId,
            this.itemCache.getIndex(followingItemId),
            this.itemCache.getHeight(followingItemId),
            currentItemPosition + currentItemHeight);
          currentItemId = followingItemId;
        }
      }
    }
  }


  /**
   *  Get itemId of a item in _positionMaps by position.
   *
   *  @param {number} positionTop - Where wanna get item in this.
   *
   *  @return {string} - itemId.
   *  @return {number} - OUT_OF_RANGE ('out of range'): if position param is greater than total height.
   */
  _getItemIdFromPosition(positionTop: number): string {
    const data = this.viewModel.getData;
    if (!!data.length) {
      if (positionTop >= this._getEstimatedTotalHeight()) return this._getItemIdFromIndex(data.length - 1);

      for (let key of this.itemCache.getItemsMap.keys()) {
        if (positionTop >= this.itemCache.getPosition(key) &&
          positionTop < this.itemCache.getPosition(key) + this.itemCache.getHeight(key)) {
          return key;
        }
      }
    }
  }


  /**
   *  Get itemId from index.
   *
   *  @param {number} index - Index of item.
   *
   *  @return {string} - itemId.
   *  @return {number} - OUT_OF_RANGE: if index out of range of data.
   */
  _getItemIdFromIndex(index: number): string {
    const data = this.viewModel.getData;
    if (!!data.length) {
      if (index >= data.length || index < 0) return OUT_OF_RANGE;
      return this.itemCache.getIndexMap.get(index);
    }
  }

  /**
   *  Return an array that stores itemId of items rendering in batch.
   *
   *  @param {number} scrollTop - Offset top of Masonry.
   *
   *  @return {Array<string>} - Can be empty.
   */
  _getItemsInBatch(scrollTop: number): Array<string> {
    const data = this.viewModel.getData;
    const {height, numOfOverscan} = this.props;
    let results: Array<string> = [];

    if (!!data.length) {
      const currentIndex = this.itemCache.getIndex(this._getItemIdFromPosition(scrollTop));
      const numOfItemInViewport = this._getItemsInViewport(scrollTop, height).length;
      const startIndex = Math.max(0, currentIndex - numOfOverscan);
      const endIndex = Math.min(currentIndex + numOfItemInViewport + numOfOverscan, data.length);

      for (let i = startIndex; i < endIndex; i++) {
        results.push(data[i].itemId);
      }
    }
    return results;
  }

  /**
   *  Return an array stores all items rendering in viewport.
   *
   *  @param {number} scrollTop - This masonry position.
   *  @param {number} viewportHeight
   *
   *  @return {Array<string>} - Stores all items' id in viewport. Can be empty.
   */
  _getItemsInViewport(scrollTop: number, viewportHeight: number): Array<string> {
    const data = this.viewModel.getData;
    const results = [];

    if (!!data.length) {
      const itemIdStart = this._getItemIdFromPosition(scrollTop);
      if (itemIdStart !== NOT_FOUND) {
        results.push(itemIdStart);

        // disparity > 0 when scrollTop position is between `the item's position` and `item's position + its height`.
        const disparity = scrollTop - this.itemCache.getPosition(itemIdStart);
        let remainingViewHeight = viewportHeight - this.itemCache.getHeight(itemIdStart) + disparity;

        let i = 1;
        let itemIndex = this.itemCache.getIndex(itemIdStart);
        if (itemIndex + i >= data.length) {
          itemIndex = data.length - 2;
        }

        let nextItemId = this._getItemIdFromIndex(itemIndex + i);
        let nextItemHeight = this.itemCache.getHeight(nextItemId);

        while (remainingViewHeight > nextItemHeight && nextItemHeight !== 0) {
          remainingViewHeight -= nextItemHeight;
          results.push(nextItemId);
          i++;
          nextItemId = this._getItemIdFromIndex(itemIndex + i);
          if (nextItemId !== OUT_OF_RANGE) {
            nextItemHeight = this.itemCache.getHeight(nextItemId);
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
    if (this.itemCache.hasItem(itemId)) {
      this._scrollToOffset(this.itemCache.getPosition(itemId) + disparity);
    }
  }
}

export default Masonry;