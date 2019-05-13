export type CellRenderer = (params: {|
  index: number,
  isScrolling: boolean,
  style: mixed,
|}) => mixed;

export type Position = {
  top: number,
  left: number,
}