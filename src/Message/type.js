type OnChangedHeightCallback = (params: {|
  itemId: string,
  newHeight: number
|}) => void

export type OnRemoveCallback = (params: {|
  itemId: string,
|}) => void

export type MessageProps = {
  id: string,
  userAvatarUrl: string,
  userName: string,
  messageContent: string,
  sentTime: string,
  onChangedHeight: OnChangedHeightCallback,
  onRemoveItem: OnRemoveCallback,
}

