class MessageViewModel {
  constructor() {
  }

  onRemove(itemId, removeCallback) {
    removeCallback(itemId);
  }
}

export default MessageViewModel;