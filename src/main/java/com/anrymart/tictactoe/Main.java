package com.anrymart.tictactoe;

import com.anrymart.tictactoe.controller.GameController;
import io.javalin.Javalin;

import static io.javalin.apibuilder.ApiBuilder.*;

public class Main {

    public static void main(String[] args) {
        Javalin app = Javalin.create(config -> {
            config.addStaticFiles("/public");
            config.enableCorsForAllOrigins();
        }).start(8080);

        GameController gameController = new GameController();

        app.routes(() -> {
            path("main", () -> {
                get(gameController::getGamePreviews);
                ws(gameController::mainPageEvents);
            });

            path("game", () -> {
                post(gameController::createGame);
                path(":id", () -> {
                    get(gameController::getGame);
                    ws(gameController::gameEvents);
                });
            });
        });
    }
}
