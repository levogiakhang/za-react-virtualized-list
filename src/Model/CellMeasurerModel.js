import * as React from 'react';
import CellMeasurerCache from "../CellMeasurer/CellMeasurerCache";
import { Position } from "../utils/types";
import type { ModelBase } from "./ModelBase";

class CellMeasurerModel implements ModelBase{
  constructor(props) {
    this.id = props.id;
    this.cache = props.cache;
    this.position = props.position;
    this.onChangedHeight = props.onChangedHeight;
  }

  getItemId() {
    return this.id;
  }

  get getPosition(): Position {
    return this.position;
  }

  get getCache(): CellMeasurerCache {
    return this.cache;
  }
}

export default CellMeasurerModel;