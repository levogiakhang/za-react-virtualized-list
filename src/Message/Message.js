// @flow

import React from 'react';
import { MessageProps } from './type';
import './css/TheirMessage.css'
import './css/MyMessage.css'
import type { MessageBase } from "../ModelBase/MessageBase";
import Masonry from "../Masonry/Masonry";

export default class Message extends React.PureComponent<MessageProps> implements MessageBase {
  constructor(props) {
    super(props);

    this.state = {
      isExpanded: false,
    };

    this._onClick = this._onClick.bind(this);
  }

  get getItemId(): string {
    return this.props.id;
  }

  get getUserAvatarUrl(): string {
    return this.props.userAvatarUrl;
  }

  get getUserName(): string {
    return this.props.userName;
  }

  get getMessageContent(): string {
    return this.props.messageContent;
  }

  get getSentTime(): string {
    return this.props.sentTime;
  }

  get getIsMine(): boolean {
    return this.props.isMine;
  }

  _getDisplayTime = (time): string => {
    let minutes = time.getMinutes();
    if (time.getMinutes() < 10) {
      minutes = '0' + time.getMinutes();
    }
    let hours = time.getHours();
    if (time.getHours() < 10) {
      hours = '0' + time.getHours();
    }
    return hours + ':' + minutes;
  };

  _onClick() {
    const { isExpanded } = this.state;
    isExpanded ?
      this.setState({ isExpanded: false }) :
      this.setState({ isExpanded: true })
  }

  render() {
    const { id, userAvatarUrl, userName, messageContent, sentTime, isMine } = this.props;
    const { isExpanded } = this.state;
    return (
      isMine ?
        <div id={id} className="row">
          <div className="my-message-container">
            {/* MESSAGE CONTENT VIEW */}
            <div className="my-message-content-container">
              <div className="my-message-content-user-name">
                <p>{userName}</p>
              </div>

              <div className="my-message-content-content">
                <p>{messageContent}</p>
              </div>

              <div className="my-message-content-sent-time">
                <p>{this._getDisplayTime(new Date(sentTime))}</p>
              </div>
            </div>

            {/* AVATAR VIEW */}
            <div className="my-message-avatar-container">
              <div className="my-message-avatar-border">
                <img className="my-message-avatar"
                     src={userAvatarUrl}
                     alt="Avatar Image"/>
              </div>
            </div>
          </div>
        </div>

        :

        <div id={id} className={isExpanded ? "expand-height" : "their-message-container"}>
          {/* AVATAR VIEW */}
          <div className="their-message-avatar-container">
            <div className="their-message-avatar-border">
              <img className="their-message-avatar"
                   src={userAvatarUrl}
                   alt="Avatar Image"/>
            </div>
          </div>

          {/* MESSAGE CONTENT VIEW */}
          <div className="their-message-content-container">
            <div className="their-message-content-user-name">
              <p>{userName}</p>
            </div>

            <div className="their-message-content-content">
              <p>{messageContent}</p>
            </div>

            <div className="their-message-content-sent-time">
              <p>{this._getDisplayTime(new Date(sentTime))}</p>
            </div>
          </div>

          <div className={"button-container"}>
            <button className={"red"} onClick={this._onClick}>
              {isExpanded ?
                "Minimize" :
                "Expand"
              }
            </button>
          </div>
        </div>
    );
  }
}