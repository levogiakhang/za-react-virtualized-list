/** @flow */
import * as React from 'react';
import * as ReactDOM from "react-dom";
import ResizeObserver from 'resize-observer-polyfill';
import throttle from "../utils/throttle";
import { THROTTLING_TIMER } from "../utils/value";
import CellMeasurerModel from "../Model/CellMeasurerModel";
import CellMeasurerViewModel from "../ViewModel/CellMeasurerViewModel";

export default class CellMeasurer extends React.PureComponent<CellMeasurerModel> {
  constructor(props) {
    super(props);

    this.model = props;
    this._cellMeasurer = undefined;
    this.resizeObserver = undefined;
    this.viewModel = undefined;
  }

  componentDidMount() {
    this._cellMeasurer = ReactDOM.findDOMNode(this);
    this.viewModel = new CellMeasurerViewModel({node: this._cellMeasurer, model: this.model});
    this.resizeObserver = new ResizeObserver(throttle(this.viewModel.onChildrenChangeHeight, THROTTLING_TIMER));
    this.resizeObserver.observe(this._cellMeasurer);
  }

  componentWillUnmount() {
    this.resizeObserver.disconnect(this._cellMeasurer);
  }

  render() {
    const { children, id, position: { top, left } } = this.props;

    return (
      <div id={id}
           style={{
             position: 'absolute',
             top: top,
             left: left,
             width: '100%'
           }}>
        {children}
      </div>
    );
  }

}