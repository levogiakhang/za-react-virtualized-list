import ViewModelBase from "./ViewModelBase";

class MessageViewModel extends ViewModelBase {
  constructor() {
    super();
  }

  onRemove(itemId, removeCallback) {
    removeCallback(itemId);
  }
}

export default MessageViewModel;