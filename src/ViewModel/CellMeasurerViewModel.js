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
      this.model.onChangedHeight(this.model.id, this._newHeight);
    }
  };

  _isChangedHeight() {
    this._newHeight = this._getCellHeight();
    if (this._oldHeight !== this._newHeight) {
      //console.log('id: ' + this.props.id + " old: " + this._oldHeight + ' new: ' + this._newHeight  );
      this._oldHeight = this._newHeight;
      return true;
    }
    return false;
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