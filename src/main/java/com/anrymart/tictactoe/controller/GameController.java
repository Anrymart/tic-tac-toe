package com.anrymart.tictactoe.controller;

import com.anrymart.tictactoe.data.Game;
import com.anrymart.tictactoe.message.ErrorMessage;
import com.anrymart.tictactoe.message.GameMessage;
import com.anrymart.tictactoe.message.MoveMessage;
import com.anrymart.tictactoe.message.PlayersMessage;
import com.anrymart.tictactoe.model.GamePreview;
import com.anrymart.tictactoe.model.Move;
import io.javalin.http.Context;
import io.javalin.websocket.WsContext;
import io.javalin.websocket.WsHandler;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

public class GameController {

    private final Map<WsContext, String> watchers = new ConcurrentHashMap<>();
    private final List<Game> games = new CopyOnWriteArrayList<>();

    public void getGamePreviews(Context ctx) {
        ctx.json(games.stream()
                .map(GameController::gamePreview)
                .collect(Collectors.toList())
        );
    }

    public void createGame(Context ctx) {
        String name = ctx.queryParam("name");
        String player = player(ctx);
        Game game = new Game(name, player);
        games.add(game);
        broadcastMessage(watchers.keySet(), new GameMessage(gamePreview(game)));
    }

    public void getGame(Context ctx) {
        int gameId = gameId(ctx);
        ctx.json(games.get(gameId).getGameState());
    }

    public void mainPageEvents(WsHandler ws) {
        ws.onConnect(ctx -> {
            watchers.put(ctx, player(ctx));
        });
        ws.onClose(watchers::remove);
    }

    public void gameEvents(WsHandler ws) {
        ws.onConnect(ctx -> {
            int gameId = gameId(ctx);
            Game game = games.get(gameId);
            game.getPlayers().put(ctx, player(ctx));
            PlayersMessage message = new PlayersMessage(gameId, new TreeSet<>(game.getPlayers().values()));
            broadcastMessage(game.getPlayers().keySet(), message);
            broadcastMessage(watchers.keySet(), message);
        });
        ws.onClose(ctx -> {
            int gameId = gameId(ctx);
            Game game = games.get(gameId);
            game.getPlayers().remove(ctx);
            PlayersMessage message = new PlayersMessage(gameId, new TreeSet<>(game.getPlayers().values()));
            broadcastMessage(game.getPlayers().keySet(), message);
            broadcastMessage(watchers.keySet(), message);
        });
        ws.onMessage(ctx -> {
            int gameId = gameId(ctx);
            Game game = games.get(gameId);
            Move move = ctx.message(Move.class);
            try {
                move = game.addMove(move.getValue(), move.getPosition(), player(ctx));
                MoveMessage message = new MoveMessage(gameId, move);
                broadcastMessage(game.getPlayers().keySet(), message);
                broadcastMessage(watchers.keySet(), message);
            } catch (Exception e) {
                if (ctx.session.isOpen()) {
                    ctx.send(new ErrorMessage(e.getMessage()));
                }
            }
        });
    }

    private static void broadcastMessage(Collection<WsContext> recipients, Object message) {
        recipients.stream().filter(ctx -> ctx.session.isOpen()).forEach(ctx -> {
            ctx.send(message);
        });
    }

    private static String player(Context ctx) {
        return ctx.queryParam("player");
    }

    private static String player(WsContext ctx) {
        return ctx.queryParam("player");
    }

    private static int gameId(Context ctx) {
        return Integer.parseInt(ctx.pathParam("id"));
    }

    private static int gameId(WsContext ctx) {
        return Integer.parseInt(ctx.pathParam("id"));
    }

    private static GamePreview gamePreview(Game game) {
        return new GamePreview(game.getName(), game.getPlayers().size(), game.getLastMove(), game.isComplete());
    }
}
