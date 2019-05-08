// @flow

import React from 'react';

type Props = {
  className: string,
  id: ?string,
  style: mixed,
  width: number,
  overscan: number,
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
    const { className, id, style } = this.props;
    const estimateTotalHeight = this._getEstimatedTotalHeight();

    const children = [];

    this._pushChildrenContent(children);

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

  _getEstimatedTotalHeight() {

  }

  _pushChildrenContent(children: []) {

  }
}

export default Masonry;