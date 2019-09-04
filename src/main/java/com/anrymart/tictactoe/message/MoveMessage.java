package com.anrymart.tictactoe.message;

import com.anrymart.tictactoe.model.Move;
import lombok.Value;

@Value
public class MoveMessage {
    String type = "moveMessage";
    int gameId;
    Move move;
}
