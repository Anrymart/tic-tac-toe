package com.anrymart.tictactoe.model;

import lombok.Value;

import java.util.Date;

@Value
public class Move {
    int value;
    int position;
    String player;
    Date date;
    boolean isWinning;
    WinningSequence winningSequence;
}
