// @flow

export interface IViewModel {
  onRemove(itemId: string): void;

  onAdd(index: number): void;

}