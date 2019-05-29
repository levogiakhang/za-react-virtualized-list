export type OnRemoveCallback = (params: {|
  itemId: string,
|}) => void

export type MessageProps = {
  id: string,
  userAvatarUrl: string,
  userName: string,
  messageContent: string,
  sentTime: string,
  onRemoveItem: OnRemoveCallback,
}

