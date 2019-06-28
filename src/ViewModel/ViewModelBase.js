import type { IViewModel } from "./IViewModel";

class ViewModelBase implements IViewModel{
  constructor() {

  }

  onRemove(itemId, removeCallback) {
    removeCallback(itemId);
  }

  onAdd(index) {
  }
}

export default ViewModelBase;