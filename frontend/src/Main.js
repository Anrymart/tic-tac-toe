import React from 'react';
import {w3cwebsocket as W3CWebSocket} from 'websocket';
import request from 'request'
import api from './api'
import Popup from "./Popup";
import Game from "./Game";

class Main extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            player: localStorage.getItem('player'),
            showPopup: false,
            games: [],
            selectedGame: -1
        };

        if (this.state.player) {
            this.loadDataAndSubscribe();
        }
    }

    loadDataAndSubscribe() {
        const appendPlayer = (url) => {
            return url + '?player=' + this.state.player;
        };

        request.get(appendPlayer(api.mainData), (err, response, body) => {
            if (err) {
                console.error(err);
            }
            this.setState({games: [...this.state.games, ...JSON.parse(body)]});
        });

        const client = this.client = new W3CWebSocket(appendPlayer(api.mainEvents));
        client.onopen = () => {
            console.log('WebSocket Client Connected');
        };
        client.onmessage = (message) => {
            this.handleMessage(JSON.parse(message.data));
        };
        client.onerror = function () {
            console.log('WebSocket Connection Error');
        };
        client.onclose = function () {
            console.log('WebSocket Client Closed');
        };
    }

    handleMessage(message) {
        switch (message.type) {
            case 'gameMessage':
                this.setState(
                    {
                        games: [...this.state.games, message.gamePreview]
                    }
                );
                break;
            case 'moveMessage': {
                const games = this.state.games.slice();
                games[message.gameId].lastMove = message.move;
                games[message.gameId].complete = message.move.winning;
                this.setState({
                    games
                });
                break;
            }
            case 'playersMessage': {
                const games = this.state.games.slice();
                games[message.gameId].players = message.players.length;
                this.setState({
                    games
                });
                break;
            }
            default:
                console.warn(`Unknown message type '${message.type}'`);
                break;
        }
    }

    createGame = (gameName) => {
        request.post(`${api.gameData}?name=${gameName}&player=${this.state.player}`, (err, response, body) => {
            if (err) {
                console.log(err);
            }
        });
        this.togglePopup();
    };

    togglePopup = () => {
        this.setState({showPopup: !this.state.showPopup});
    };

    selectGame = (idx) => {
        this.setState({selectedGame: idx});
    };

    backToMenu = () => {
        this.setState({selectedGame: -1});
    };

    setPlayer = (player) => {
        this.setState({player});
        localStorage.setItem('player', player);
        this.loadDataAndSubscribe();
    };

    render() {
        const menu = (
            <div>
                <h2>Games</h2>
                <button onClick={this.togglePopup}>New game</button>
                {this.state.games.map((game, idx) =>
                    (<div key={idx} className="game-preview">
                        <div className="game-name" onClick={() => {
                            this.selectGame(idx)
                        }}>{game.name}</div>
                        <div className="game-info">
                            <span>Playing: {game.players}</span>
                            <span>Last move: {game.lastMove && game.lastMove.date ? new Date(game.lastMove.date).toLocaleString('RU-ru') : 'no moves yet'}</span>
                            {game.complete && <span>Complete</span>}
                        </div>
                    </div>)
                )}
                {
                    this.state.showPopup ?
                        <Popup label="Game name:" cancel={true} onSubmit={this.createGame}
                               onCancel={this.togglePopup}/> : null
                }
            </div>
        );

        return (
            <div className="main">
                {
                    this.state.player ?
                        (<div className="player">
                            Username: {this.state.player}
                        </div>) :
                        <Popup label="Enter your name:" onSubmit={(player) => this.setPlayer(player)}
                               onCancel={this.togglePopup}/>
                }
                {
                    this.state.selectedGame === -1 ?
                        menu :
                        <Game player={this.state.player} gameId={this.state.selectedGame} onReturn={this.backToMenu}/>}
            </div>
        );
    }
}

export default Main;
