export type MessageProps = {
  id: string,
  userAvatarUrl: string,
  userName: string,
  messageContent: string,
  sentTime: string,
  onChangedHeight: OnChangedHeightCallback,
}

type OnChangedHeightCallback = (params: {|
  itemId: string,
  newHeight: number
|}) => void