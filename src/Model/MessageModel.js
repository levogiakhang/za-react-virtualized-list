import type { ModelBase } from "./ModelBase";

class MessageModel implements ModelBase {
  constructor(props) {
    this.id = props.id;
    this.userAvatarUrl = props.userAvatarUrl;
    this.userName = props.userName;
    this.messageContent = props.messageContent;
    this.sentTime = props.sentTime;
    this.isMine = props.isMine;
    this.onRemoveItem = props.onRemoveItem;
  }

  getItemId() {
    return this.id;
  }

  get getUserAvatarUrl(): string {
    return this.userAvatarUrl;
  }

  get getUserName(): string {
    return this.userName;
  }

  get getMessageContent(): string {
    return this.messageContent;
  }

  get getSentTime(): string {
    return this.sentTime;
  }

  get getIsMine(): boolean {
    return this.isMine;
  }

  get onRemoveCallBack() {
    return this.onRemoveItem;
  }
}

export default MessageModel;