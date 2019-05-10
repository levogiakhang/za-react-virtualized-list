// @flow

import React from 'react';
import type { CellRenderer } from "../Utils/types";

type Props = {
  className?: string,
  id?: ?string,
  style?: mixed,
  height: number,
  overscan?: number,
  cellRenderer: CellRenderer,
  cellCount: number,
};

class Masonry extends React.PureComponent<Props> {
  constructor(props) {
    super(props);

    this.state = {
      isScrolling: false
    }
  }

  componentDidMount() {

  }

  render() {
    const { className, id, height, style, isScrolling, cellRenderer, cellCount } = this.props;
    const estimateTotalHeight = this._getEstimatedTotalHeight(cellCount, 100);

    const children = [];


    for (let i = 0; i <= cellCount - 1; i++)
      children.push( () => {
        cellRenderer({
          id,
          isScrolling,
          style: {
            height: 120,
            position: 'absolute',
            width: '100%',
          },
        })}
      );

    console.log(children);
    return (
      <div className={className}
           id={id}
           onScroll={this._onScroll}
           style={{
             boxSizing: 'border-box',
             overflowX: 'hidden',
             overflowY: estimateTotalHeight < height ? 'hidden' : 'auto',
             width: 'auto',
             height: height,
             position: 'relative',
             willChange: 'transform',
             ...style
           }}>
        <div className="innerScrollContainer"
             style={{
               width: '100%',
               height: estimateTotalHeight,
               maxWidth: '100%',
               maxHeight: estimateTotalHeight,
               overflow: 'hidden',
               position: 'relative',
               pointerEvents: isScrolling ? 'none' : '', // property defines whether or not an element reacts to pointer events.
             }}>
          {children}
        </div>
      </div>
    );
  }

  _onScroll() {

  }

  _getEstimatedTotalHeight(cellCount: number, defaultCellHeight: number): number {
    return cellCount * defaultCellHeight;
  }

  // _pushChildrenContent(children: [], cellRenderer, cellCount) {
  //   for (let i = 0; i <= cellCount - 1; i++)
  //     children.push(
  //       cellRenderer({
  //         index,
  //         isScrolling,
  //         style: {},
  //       }),
  //     );
  // }
}

export default Masonry;