import type { IViewModel } from "./IViewModel";

class ViewModelBase implements IViewModel{
  constructor() {

  }

  onRemove(itemId) {
    // masonry.remove...
  }

  onAdd(index) {
  }
}

export default ViewModelBase;