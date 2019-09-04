import React from 'react';

class Notification extends React.Component {

    render() {
        return (
            <div className={'notification' + (this.props.visible ? ' _visible' : '')} onClick={this.props.onClick}>
                {this.props.value}
            </div>);
    }
}

export default Notification;
