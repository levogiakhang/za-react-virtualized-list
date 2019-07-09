class CellMeasurerViewModel {
  constructor({node: cellMeasurer, model: model}) {
    this.cellMeasurer = cellMeasurer;
    this.model = model;

    this._oldHeight = this.model.cache.defaultHeight;
    this._newHeight = undefined;
    this.onChildrenChangeHeight = this.onChildrenChangeHeight.bind(this);
  }

  onChildrenChangeHeight() {
    if (this._isChangedHeight()) {
      const oldHeightCache = this._oldHeight;
      this._oldHeight = this._newHeight;
      this.model.onChangedHeight(this.model.id, this._newHeight, oldHeightCache);
    }
  };

  _isChangedHeight() {
    this._newHeight = this._getCellHeight();
    return this._oldHeight !== this._newHeight;
  }

  _getCellHeight() {
    if (
      this.cellMeasurer &&
      this.cellMeasurer.ownerDocument &&
      this.cellMeasurer.ownerDocument.defaultView &&
      this.cellMeasurer instanceof this.cellMeasurer.ownerDocument.defaultView.HTMLElement
    ) {
      return Math.round(this.cellMeasurer.offsetHeight);
    }
  }
}

export default CellMeasurerViewModel;