const host = `${window.location.hostname}:8080`;

export default {
    mainEvents: `ws://${host}/main`,
    gameEvents: `ws://${host}/game`,
    mainData: `http://${host}/main`,
    gameData: `http://${host}/game`
};
