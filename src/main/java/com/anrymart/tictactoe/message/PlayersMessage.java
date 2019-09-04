package com.anrymart.tictactoe.message;

import lombok.Value;

import java.util.Collection;

@Value
public class PlayersMessage {
    String type = "playersMessage";
    int gameId;
    Collection<String> players;
}
