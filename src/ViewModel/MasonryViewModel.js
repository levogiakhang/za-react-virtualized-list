import ItemCache from "../utils/ItemCache";
import { NOT_FOUND } from "../utils/value";

class MasonryViewModel {
  constructor({data, masonry, cellCache}) {
    this.data = data;
    this.masonry = masonry;
    this.cellCache = cellCache;
    this.loadMoreTopCallback = undefined;
    this.loadMoreBottomCallback = undefined;
  }

  onLoadMoreTop(fn) {
    if (typeof fn === 'function') {
      this.loadMoreTopCallback = fn;
    }
  }

  onLoadMoreBottom(fn) {
    if (typeof fn === 'function') {
      this.loadMoreBottomCallback = fn;
    }
  }

  onRemoveItem(itemId) {
    if (this.masonry) {
      this.masonry.current.onRemoveItem(itemId);
      this.masonry.current.reRender();
    }
  }

  onAddItem(index, item) {
    if (this.masonry && !this.isIdAlready(item.itemId)) {
      this.data.splice(index, 0, item);
      this.masonry.current.reRender();
    }
  }

  onUpdateItem(itemId, item) {
    if (this.masonry && this.isIdAlready(itemId)) {
      const itemIndex = this.masonry.current.itemCache.getIndex(itemId);
      if (itemIndex !== NOT_FOUND) {
        this.data[itemIndex] = item;
        this.masonry.current.reRender();
      }
    }
  }

  isIdAlready(id: string): boolean {
    if (Array.isArray(this.data)) {
      return this.data.find((item) => {
        return item.itemId === id;
      }) !== undefined
    }
  };

  // region GET-SET
  get getData() {
    return this.data;
  }

  get getMasonry() {
    return this.masonry;
  }

  get getCellCache() {
    return this.cellCache;
  }

  get getLoadMoreTopCallBack() {
    return this.loadMoreTopCallback;
  }

  get getLoadMoreBottomCallBack() {
    return this.loadMoreBottomCallback;
  }

  set setData(data) {
    this.data = data;
  }

  set setMasonry(masonry) {
    this.masonry = masonry;
  }

  set setCellCache(cache) {
    this.cellCache = cache;
  }

  // endregion
}

export default MasonryViewModel;