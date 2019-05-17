export type CellRenderer = (params: {|
  index: number,
  isScrolling: boolean,
  style: mixed,
  position: Position
|}) => mixed;

export type Position = {
  top: number,
  left: number,
}

export type RenderCallback = (top: number, left: number) => void;