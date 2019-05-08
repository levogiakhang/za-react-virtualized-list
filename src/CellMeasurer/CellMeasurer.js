/** @flow */
import * as React from 'react';
import CellMeasurerCache from "./CellMeasurerCache";

type Props = {
  id: string,
  cache: CellMeasurerCache,
  children: React.Element<*>,
}

export default class CellMeasurer extends React.PureComponent<Props> {
  componentDidMount() {
    const { children } = this.props;
  }

  render() {
    const { children } = this.props;
    return children;
  }

  _getCellSize() {
    const { cache } = this.props;

  }


}