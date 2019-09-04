package com.anrymart.tictactoe.message;

import com.anrymart.tictactoe.model.GamePreview;
import lombok.Value;

@Value
public class GameMessage {
    String type = "gameMessage";
    GamePreview gamePreview;
}
