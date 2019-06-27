import type { IViewModel } from "./IViewModel";

class ViewModelBase implements IViewModel{
  constructor(itemId) {
    this.itemId = itemId;
  }

  onRemove(itemId) {
  }
}