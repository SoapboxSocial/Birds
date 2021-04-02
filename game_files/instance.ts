import PlayersManager from "./playersManager";
import PipeManager from "./pipeManager";
import {ServerStateEnum} from "../shared";
import {PlayerState, ServerState} from "./enums";
import Player, {PlayerTinyObject} from "./player";
import {constants as Const} from "../constants";
import {checkCollision} from "./collisionEngine";

export default class Instance {
    private playersManager: PlayersManager;
    private pipeManager: PipeManager;
    private state: ServerStateEnum;
    private timeStartGame: number;
    private lastTime: number | null;
    private timer: NodeJS.Timeout | null;

    private sockets: any[] = []

    constructor() {
        this.playersManager = new PlayersManager()
        this.pipeManager = new PipeManager()
        this.state = ServerStateEnum.WaitingForPlayers
        this.lastTime = null
        this.timer = null
        this.timeStartGame = 0
    }

    start() {

        this.playersManager.on("players-ready", function () {
            this.startGameLoop();
        });


        this.pipeManager.on("need_new_pipe", function () {
            // Create a pipe and send it to clients
            var pipe = this.pipeManager.newPipe();
        });

    }

    handle(socket: any) {
        // Add new player
        let player = this.playersManager.addNewPlayer(socket, socket.id);

        // Register to socket events
        socket.on("disconnect", function () {
            socket.get("PlayerInstance", function (_: any, _player: Player) {
                this.playersManager.removePlayer(_player);

                socket.broadcast.emit("player_disconnect", _player.getPlayerObject());

                // @ts-ignore
                player = null;
            });
        });

        socket.on(
            "say_hi",
            function (
                nick: string,
                floor: number,
                fn: (gameState: ServerStateEnum, playerId: string) => void
            ) {
                fn(this.gameState, player.getID());

                this.playerLog(socket, nick, floor);
            }
        );

        // Remember PlayerInstance and push it to the player list
        socket.set("PlayerInstance", player);
    }

    updateGameState(newState: ServerStateEnum, notifyClients: boolean) {
        var log = "\t[SERVER] Game state changed ! Server is now ";

        this.state = newState;

        switch (this.state) {
            case ServerState.WaitingForPlayers:
                log += "in lobby waiting for players";
                break;
            case ServerState.OnGame:
                log += "in game !";
                break;
            case ServerState.Ranking:
                log += "displaying ranking";
                break;
            default:
                log += "dead :p";
        }

        console.info(log);

        // If requested, inform clients about the change
        if (notifyClients) {
            this.sockets.forEach(function (socket) {
                socket.emit("update_game_state", newState)
            })
        }
    }

    playerLog(socket: any, nick: string, floor: number) {
        // Retrieve PlayerInstance
        socket.get("PlayerInstance", function (error: any, player: Player) {
            if (error) {
                console.error(error);
                return
            }

            // Bind new client events
            socket.on("change_ready_state", function (readyState: boolean) {
                // If the server is currently waiting for players, update ready state
                if (this.state === ServerState.WaitingForPlayers) {
                    this.playersManager.changeLobbyState(player, readyState);
                    socket.broadcast.emit("player_ready_state", player.getPlayerObject());
                }
            });

            socket.on("player_jump", function () {
                player.jump();
            });

            // Set player's nickname and prepare him for the next game
            this.playersManager.prepareNewPlayer(player, nick, floor);

            // Notify new client about other players AND notify other about the new one ;)
            socket.emit("player_list", this.playersManager.getPlayerList());

            socket.broadcast.emit("new_player", player.getPlayerObject());
        });
    }

    createNewGame() {
        let players: PlayerTinyObject[];

        // Flush pipe list
        this.pipeManager.flushPipeList();

        // Reset players state and send it
        players = this.playersManager.resetPlayersForNewGame();

        for (let i = 0; i < players.length; i++) {
            this.sockets.forEach(function (socket) {
                socket.emit("player_ready_state", players[i])
            })
        }

        // Notify players of the new game state
        this.updateGameState(ServerStateEnum.WaitingForPlayers, true)
    }

    gameOver() {
        // Stop game loop
        if (this.timer) {
            clearInterval(this.timer);
        }

        this.lastTime = null;

        // Change server state
        this.updateGameState(ServerState.Ranking, true);

        // Send players score
        this.playersManager.sendPlayerScore();

        // After 5s, create a new game
        setTimeout(this.createNewGame, Const.TIME_BETWEEN_GAMES);
    }

    startGameLoop() {
        // Change server state
        this.updateGameState(ServerState.OnGame, true);

        // Create the first pipe
        this.pipeManager.newPipe();

        // Start timer
        this.timer = setInterval(function () {
            let now = new Date().getTime();
            let ellapsedTime = 0;

            // get time difference between the last call and now
            if (this.lastTime) {
                ellapsedTime = now - this.lastTime;
            } else {
                this.timeStartGame = now;
            }

            this.lastTime = now;

            // If everyone has quit the game, exit it
            if (this.playersManager.getNumberOfPlayers() === 0) {
                this.gameOver();
            }

            // Update players position
            this.playersManager.updatePlayers(ellapsedTime);

            // Update pipes
            this.pipeManager.updatePipes(ellapsedTime);

            // Check collisions
            if (
                checkCollision(
                    this.pipeManager.getPotentialPipeHit(),
                    // @ts-ignore
                    this.playersManager.getPlayerList(PlayerState.Playing)
                )
            ) {
                if (!this.playersManager.arePlayersStillAlive()) {
                    this.gameOver();
                }
            }

            this.sockets.forEach(function (socket) {
                socket.emit("game_loop_update", {
                    players: this.playersManager.getOnGamePlayerList(),
                    pipes: this.pipeManager.getPipeList(),
                })
            })
        }, 1000 / 60);
    }
}