// @flow

import React from 'react';
import { MessageProps } from './type';
import './css/TheirMessage.css'

export default class Message extends React.PureComponent<MessageProps> {
  _getDisplayTime = (time) : string => {
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

  render() {
    const { id, userAvatarUrl, userName, messageContent, sentTime } = this.props;
    return (
      <div className="their-message-container">
        {/*
        * AVATAR VIEW
        */}
        <div className="their-message-avatar-container">
          <div className="their-message-avatar-border">
            <img className="their-message-avatar"
                 src={userAvatarUrl}
                 alt="Avatar Image"/>
          </div>
        </div>

        {/*
        * MESSAGE CONTENT VIEW
        */}
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

      </div>
    );
  }
}