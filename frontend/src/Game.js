import React from 'react';
import {w3cwebsocket as W3CWebSocket} from "websocket";
import api from "./api";
import request from "request";
import Notification from "./Notification";

const fieldSize = 10;

class Game extends React.Component {

    constructor(props) {
        super(props);

        const field = [];
        for (let i = 0; i < fieldSize; i++) {
            field[i] = [];
        }

        this.state = {
            field,
            moves: [],
            players: [],
            complete: false,
            nextMove: 1,
            winningSequence: null,
            notification: '',
            notificationVisible: false,
            showHistory: false
        };
    }

    componentDidMount() {
        const client = this.client = new W3CWebSocket(`${api.gameEvents}/${this.props.gameId}?player=${this.props.player}`);
        client.onopen = () => {
            console.log('WebSocket Client Connected');
        };
        client.onmessage = (message) => {
            this.handleMessage(JSON.parse(message.data));
        };
        client.onerror = function () {
            alert('WebSocket Connection Error');
        };

        request.get(`${api.gameData}/${this.props.gameId}?player=${this.props.player}`, (err, response, body) => {
            if (err) {
                console.log(err);
            }
            const res = JSON.parse(body);
            res.nextMove = res.moves.length ? 3 - res.moves[res.moves.length - 1].value : 1;
            if (res.complete) {
                res.winningMask = this.getWinningMask(res.moves[res.moves.length - 1].winningSequence);
            }
            this.setState(res);
        });
    }

    componentWillUnmount() {
        this.client.close();
    }

    handleMessage(message) {
        this.setState({notificationVisible: false});
        switch (message.type) {
            case 'moveMessage':
                const move = message.move;
                const [i, j] = this.getCoordinates(move.position);
                const field = this.state.field.slice();
                field[i][j] = move.value;
                this.setState({
                    field,
                    complete: move.winning,
                    winningMask: this.getWinningMask(move.winningSequence),
                    moves: [...this.state.moves, move],
                    nextMove: 3 - move.value,
                    notificationVisible: move.winning,
                    notification: move.winning ? `Congratulations! ${this.mapValue(move.value)}'s won!` : this.state.notification
                });
                break;
            case 'playersMessage':
                this.setState({
                    players: message.players
                });
                break;
            case 'errorMessage':
                this.setState({
                    notification: message.message,
                    notificationVisible: true
                });
                break;
            default:
                console.warn(`Unknown message type '${message.type}'`);
                break;
        }
        console.log(message);
    }

    getWinningMask(winningSequence) {
        if (!winningSequence)
            return;
        const mask = [];
        for (let i = 0; i < fieldSize; i++) {
            mask[i] = [];
            for (let j = 0; j < fieldSize; j++) {
                mask[i][j] = false;
            }
        }
        const {sx, sy, ex, ey} = winningSequence;
        const di = Math.sign(ex - sx);
        const dj = Math.sign(ey - sy);
        let [i, j] = [sx, sy];
        mask[i][j] = true;
        while (i !== ex || j !== ey) {
            i += di;
            j += dj;
            mask[i][j] = true;
        }
        return mask;
    }

    getCoordinates(idx) {
        const j = idx % 10;
        const i = (idx - j) / 10;
        return [i, j];
    }

    handleClick = (idx) => {
        if (this.state.complete) {
            return;
        }
        const [i, j] = this.getCoordinates(idx);
        const field = this.state.field;
        if (field[i][j]) {
            return;
        }
        this.client.send(JSON.stringify({
            value: this.state.nextMove,
            position: idx,
        }));
    };

    mapValue(val) {
        switch (val) {
            case 1:
                return '✖';
            case 2:
                return 'O';
            default:
                return '';
        }
    };


    render() {
        const lines = [];
        const field = this.state.field;
        for (let i = 0; i < fieldSize; i++) {
            const cells = [];
            for (let j = 0; j < fieldSize; j++) {
                const key = i * fieldSize + j;
                let modifiers = (field[i][j] || this.state.complete ? '' : ' _empty');
                if (!field[i][j] && !this.state.complete) {
                    if (this.state.nextMove === 1) {
                        modifiers += ' _cross';
                    } else {
                        modifiers += ' _zero';
                    }
                }
                if (this.state.winningMask && this.state.winningMask[i][j]) {
                    modifiers += ' _winning';
                }
                cells.push(<div key={key} onClick={() => {
                    this.handleClick(key)
                }}
                                className={'game-cell' + modifiers}>{this.mapValue(field[i][j])}</div>);
            }
            lines.push(<div key={i} className="game-row">{cells}</div>);
        }

        const players = [];
        this.state.players && this.state.players.forEach((player, idx) => {
            players.push(<li key={idx}>{player}</li>);
        });

        const history = [];
        if (this.state.showHistory && this.state.moves) {
            this.state.moves.forEach((move, idx) => {
                history.push(<li key={idx}>{this.mapValue(move.value)} by <strong>{move.player}</strong> at
                    ({this.getCoordinates(move.position).join(', ')})</li>);
            });
        }

        return (<div className="game">
            <h2>{this.state.name}</h2>
            <button onClick={this.props.onReturn}>Back to menu</button>
            <div className="game-container">
                <div className="game-field">
                    {lines}
                </div>
                <div className="game-sidebar">
                    <span>Created by <strong>{this.state.originator}</strong></span>
                    <div className="game-players">
                        <h4>Players</h4>
                        <ul>
                            {players}
                        </ul>
                    </div>
                </div>
            </div>
            <div className="game-history">
                <button onClick={() => {
                    this.setState({showHistory: !this.state.showHistory})
                }}>{this.state.showHistory ? 'Hide history' : 'Show history'}</button>
                <ol>
                    {history}
                </ol>
            </div>
            <Notification visible={this.state.notificationVisible}
                          value={this.state.notification}
                          onClick={() => {
                              this.setState({notificationVisible: false})
                          }}/>
        </div>);
    }
}

export default Game;
