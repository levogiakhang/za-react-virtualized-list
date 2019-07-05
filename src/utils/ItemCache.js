import { NOT_FOUND } from "./value";

class ItemCache {
  constructor() {
    // A map stores `index -> itemId`
    this.__indexMap__ = new Map();

    // A map stores `itemId -> {index, height, position}`
    this.__itemsMap__ = new Map();

    this.__renderedItems__ = new Map();
  }

  hasItem(itemId: string): boolean {
    return this.__itemsMap__.has(itemId);
  }

  getIndex(itemId: string): number {
    return this.__itemsMap__.has(itemId) ? this.__itemsMap__.get(itemId).index : NOT_FOUND
  }

  getHeight(itemId: string): number {
    return this.__itemsMap__.has(itemId) ? this.__itemsMap__.get(itemId).height : NOT_FOUND
  }

  getPosition(itemId: string): number {
    return this.__itemsMap__.has(itemId) ? this.__itemsMap__.get(itemId).position : NOT_FOUND
  }

  isItemRendered(itemId: string): boolean {
    return this.__renderedItems__.has(itemId);
  }

  getRealHeight(itemId: string) {
    return this.__renderedItems__.has(itemId) ? this.__renderedItems__.get(itemId) : NOT_FOUND
  }

  get getIndexMap() {
    return this.__indexMap__;
  }

  get getRenderedMap() {
    return this.__renderedItems__;
  }

  get getItemsMap() {
    return this.__itemsMap__;
  }

  deleteItem(itemId) {
    this.__itemsMap__.delete(itemId);
    this.__renderedItems__.delete(itemId);
  }

  updateItemOnMap(itemId: string, itemIndex: number, itemHeight: number, itemPosition: number) {
    this.__itemsMap__.set(itemId, {index: itemIndex, height: itemHeight, position: itemPosition});
  }

  updateRenderedItem(itemId: string, realHeight: number) {
    this.__renderedItems__.set(itemId, realHeight);
  }

  updateIndexMap(index: number, itemId: string) {
    this.__indexMap__.set(index, itemId);
  }
}

export default ItemCache;