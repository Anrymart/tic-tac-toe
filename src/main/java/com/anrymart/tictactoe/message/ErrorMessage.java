package com.anrymart.tictactoe.message;

import lombok.Value;

@Value
public class ErrorMessage {
    String type = "errorMessage";
    String message;
}
