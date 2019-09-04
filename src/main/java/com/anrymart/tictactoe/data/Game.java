package com.anrymart.tictactoe.data;

import com.anrymart.tictactoe.exception.InvalidMoveException;
import com.anrymart.tictactoe.model.GameState;
import com.anrymart.tictactoe.model.Move;
import com.anrymart.tictactoe.model.WinningSequence;
import io.javalin.websocket.WsContext;
import lombok.Getter;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

public class Game {

    private static final byte CROSS = 1;
    private static final byte ZERO = 2;

    private static final int FIELD_SIZE = 10;
    private static final int WINNING_LENGTH = 5;

    @Getter
    private final String name;

    private final String originator;

    @Getter
    private final Map<WsContext, String> players;

    private final Date created;

    private final List<Move> moves;
    private final int[][] field;

    @Getter
    private boolean complete;

    public Game(String name, String originator) {
        this.name = name;
        this.originator = originator;
        this.complete = false;
        created = new Date();
        players = new ConcurrentHashMap<>();
        moves = new ArrayList<>();
        field = new int[FIELD_SIZE][FIELD_SIZE];
    }

    public synchronized Move addMove(int value, int position, String player) throws InvalidMoveException {
        if (complete) {
            throw new InvalidMoveException("Game is already complete");
        }
        if (value != CROSS && value != ZERO) {
            throw new IllegalArgumentException("Value is invalid");
        }
        if (position < 0 || position >= FIELD_SIZE * FIELD_SIZE) {
            throw new IllegalArgumentException("Position is out of allowed range");
        }
        if (!moves.isEmpty() && moves.get(moves.size() - 1).getPlayer().equals(player)) {
            throw new InvalidMoveException("Consecutive moves by the same player are not allowed");
        }
        if (moves.isEmpty() && value != CROSS) {
            throw new InvalidMoveException("Invalid value for the first move");
        }
        if (!moves.isEmpty() && value == moves.get(moves.size() - 1).getValue()) {
            throw new InvalidMoveException("Invalid value for the next move");
        }
        int x = position / FIELD_SIZE;
        int y = position % FIELD_SIZE;
        if (field[x][y] != 0) {
            throw new InvalidMoveException("Value at specified position is already set");
        }
        field[x][y] = value;
        Optional<WinningSequence> winningSequence = findWinningSequence(x, y);
        Move move = new Move(value, position, player, new Date(), winningSequence.isPresent(), winningSequence.orElse(null));
        moves.add(move);
        if (winningSequence.isPresent()) {
            complete = true;
        }
        return move;
    }

    public synchronized Move getLastMove() {
        return moves.isEmpty() ? null : moves.get(moves.size() - 1);
    }

    public synchronized GameState getGameState() {
        return GameState.builder()
                .name(name)
                .originator(originator)
                .complete(complete)
                .players(players.values().stream().distinct().sorted().collect(Collectors.toList()))
                .created(new Date(created.getTime()))
                .moves(new ArrayList<>(moves))
                .field(Arrays.stream(field).map(int[]::clone).toArray(int[][]::new))
                .build();
    }

    private Optional<WinningSequence> findWinningSequence(int x, int y) {
        int val = field[x][y];
        int i, ii;

        // vertical axis
        i = ii = 1;
        while ((y - i) >= 0 && field[x][y - i] == val)
            i++;
        while ((y + ii) < FIELD_SIZE && field[x][y + ii] == val)
            ii++;
        if (i + ii > WINNING_LENGTH)
            return Optional.of(new WinningSequence(x, y - i + 1, x, y + ii - 1));

        // horizontal axis
        i = ii = 1;
        while ((x - i) >= 0 && field[x - i][y] == val)
            i++;
        while ((x + ii) < FIELD_SIZE && field[x + ii][y] == val)
            ii++;
        if (i + ii > WINNING_LENGTH)
            return Optional.of(new WinningSequence(x - i + 1, y, x + ii - 1, y));

        // diagonal axis
        i = ii = 1;
        while ((x - i) >= 0 && (y - i) >= 0 && field[x - i][y - i] == val)
            i++;
        while ((x + ii) < FIELD_SIZE && (y + ii) < FIELD_SIZE && field[x + ii][y + ii] == val)
            ii++;
        if (i + ii > WINNING_LENGTH) {
            i--;
            ii--;
            return Optional.of(new WinningSequence(x - i, y - i, x + ii, y + ii));
        }

        // anti-diagonal axis
        i = ii = 1;
        while ((x - i) >= 0 && (y + i) < FIELD_SIZE && field[x - i][y + i] == val)
            i++;
        while ((x + ii) < FIELD_SIZE && (y - ii) >= 0 && field[x + ii][y - ii] == val)
            ii++;
        if (i + ii > WINNING_LENGTH) {
            i--;
            ii--;
            return Optional.of(new WinningSequence(x - i, y + i, x + ii, y - ii));
        }

        return Optional.empty();
    }
}
