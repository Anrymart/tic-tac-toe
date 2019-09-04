package com.anrymart.tictactoe.model;

import lombok.Builder;
import lombok.Value;

import java.util.Date;
import java.util.List;

@Value
@Builder
public class GameState {

    private final String name;
    private final String originator;
    private final Date created;
    private final List<String> players;
    private final boolean complete;

    private final List<Move> moves;
    private final int[][] field;
}
