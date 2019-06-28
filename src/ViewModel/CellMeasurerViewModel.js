class CellMeasurerViewModel {
  constructor(props) {
    this._cellMeasurer = props.node;
    this.model = props.model;

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
      this._cellMeasurer &&
      this._cellMeasurer.ownerDocument &&
      this._cellMeasurer.ownerDocument.defaultView &&
      this._cellMeasurer instanceof this._cellMeasurer.ownerDocument.defaultView.HTMLElement
    ) {
      return Math.round(this._cellMeasurer.offsetHeight);
    }
  }
}

export default CellMeasurerViewModel;