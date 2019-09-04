package com.anrymart.tictactoe.model;

import lombok.Value;

@Value
public class GamePreview {
    String name;
    int players;
    Move lastMove;
    boolean complete;
}
