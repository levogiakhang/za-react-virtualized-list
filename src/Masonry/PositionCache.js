import createIntervalTree from '../vendor/intervalTree'
import type { RenderCallback } from "../utils/types";

export default class PositionCache {
  _intervalTree = createIntervalTree();

  get intervalTreeCount(): number {
    return this._intervalTree.count;
  }

  /*
  * Render all cells visible within the viewport range defined.
  * @param:
  *       scrollTop: (number) vertical position of viewport.
  *       clientHeight: (number) height of range visible cells view. - equals Masonry's height + 2 * overscan.
  *       renderCallback: (void) a callback function.
  * @return: void
  */
  renderVisibleCell(scrollTop: number, clientHeight: number, renderCallback: RenderCallback): void {
    this._intervalTree.queryInterval(
      scrollTop,
      scrollTop + clientHeight,
      ([top, left]) => {
        renderCallback()
      }
    )
  }
}