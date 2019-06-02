// @flow

export const DEFAULT_HEIGHT = 100;

type CellMeasurerCacheParams = {
  defaultHeight: number,
  height?: number,
};

export default class CellMeasurerCache {
  constructor(params: CellMeasurerCacheParams = {}) {
    const { defaultHeight, height } = params;

    // avoid unwanted value from user.
    this._defaultHeight = typeof defaultHeight === 'number' ? defaultHeight : DEFAULT_HEIGHT;

    this._height = typeof height === 'number' ? height : this._defaultHeight;
  };

  get defaultHeight(): number {
    return this._defaultHeight;
  };

  get height(): number {
    return this._height
  };

  updateHeight(height: number) {
    if (typeof height !== 'number') return;
    this._height = height;
  };
}