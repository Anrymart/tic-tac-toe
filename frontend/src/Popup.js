import React from 'react';

class Popup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: ''
        };
    }

    componentDidMount() {
        this.input.focus();
    }

    handleChange = (event) => {
        this.setState({value: event.target.value});
    };

    handleSubmit = (event) => {
        event.preventDefault();
        this.props.onSubmit(this.state.value);
        this.reset();
    };

    handleCancel = () => {
        this.props.onCancel();
        this.reset();
    };

    reset() {
        this.setState({value: ''});
    }

    render() {
        return (
            <div className="overlay">
                <div className="popup">
                    <form onSubmit={this.handleSubmit}>
                        <label>{this.props.label} </label>
                        <input type="text" className="popup-input" value={this.state.text}
                               onChange={this.handleChange}
                               ref={(input) => {
                                   this.input = input
                               }}/>
                        <div className="popup-control">
                            {this.props.cancel ?
                                <input type="button" value="Cancel" onClick={this.handleCancel}/> : ''}
                            <input type="submit" value="OK"/>
                        </div>
                    </form>
                </div>
            </div>
        );
    }
}

export default Popup;
