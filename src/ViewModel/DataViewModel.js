// @flow

import { NOT_FOUND } from "../utils/value";

class DataViewModel {
  constructor(data) {
    this.data = data;

    // for purpose quick look-up
    this.dataMap = new Map();
    this.init();
  }

  init() {
    if (Array.isArray(this.data)) {
      this.data.forEach((item) => {
        this.dataMap.set(item.itemId, item);
      })
    } else {
      console.error('The initialized data is NOT an array');
    }
  }

  clearData() {
    this.data = [];
    this.dataMap.clear();
  }

  updateNewData(data) {
    this.setData(data);
    this.init();
  }

  insertItem(index: number, item: Object) {
    if (
      Array.isArray(this.data) &&
      this._isValidIndex(index) &&
      !this._isIdAlready(item.itemId)
    ) {
      this.data.splice(index, 0, item);
      this.dataMap.set(item.itemId, item);
    }
  }

  insertItems(index: number, arrItem: Array) {
    if (
      Array.isArray(this.data) &&
      Array.isArray(arrItem) &&
      this._isValidIndex(index)
    ) {
      for (let i = 0; i <= arrItem.length - 1; i++) {
        if (!this._isIdAlready(arrItem[i].itemId)) {
          this.data.splice(index, 0, arrItem[i]);
          this.dataMap.set(arrItem[i].itemId, arrItem[i]);
        }
      }
    }
  }

  deleteItem(index: number, deleteCount: number = 1) {
    if (
      Array.isArray(this.data) &&
      this._isValidIndex(index)
    ) {
      this.dataMap.delete(this.data[index].itemId);
      this.data.splice(index, deleteCount);
    }
  }

  addItemTop(item: Object) {
    this.insertItem(0, item);
  }

  appendTop(arrItem: Array) {
    if (
      Array.isArray(this.data) &&
      Array.isArray(arrItem)
    ) {
      for (let i = arrItem - 1; i >= 0; i--) {
        if (!this._isIdAlready(arrItem[i].itemId)) {
          this.data.unshift(arrItem[i]);
          this.dataMap.set(arrItem[i].itemId, arrItem[i]);
        }
      }
    }
  }

  addItemBottom(item: Object) {
    this.data.length === 0 ?
      this.insertItem(0, item) :
      this.insertItem(this.data.length - 1, item);
  }

  appendBottom(arrItem: Array) {
    this.data.length === 0 ?
      this.insertItems(0, arrItem) :
      this.insertItems(this.data.length - 1, arrItem);
  }

  getItem(itemId: string): Object {
    return this.dataMap.has(itemId) ? this.dataMap.get(itemId) : NOT_FOUND;
  }

  _isValidIndex(index: number): boolean {
    const rsIndex = parseInt(index);
    return (
      typeof rsIndex === 'number' &&
      rsIndex <= this.data.length &&
      rsIndex >= 0
    );
  }

  _isIdAlready(id: string): boolean {
    return this.dataMap.has(id);
  };

  get getData() {
    return this.data;
  }

  setData(newData: Array) {
    this.data = newData;
  }
}

export default DataViewModel;