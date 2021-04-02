import PlayersManager from "./playersManager";
import PipeManager from "./pipeManager";
import { checkCollision } from "./collisionEngine";
import { ServerState, PlayerState } from "./enums";
import { constants as Const } from "../../constants";
import { ServerStateEnum } from "./shared";
import Player from "./player";

let _playersManager: PlayersManager;

let _pipeManager: PipeManager;

/**
 * @todo convert to Socket.io instance
 */
let io: any;

let _gameState: ServerStateEnum;

let _timeStartGame: number;

let _lastTime: number | null = null;

let _timer: NodeJS.Timeout;

// @TODO extend here with room id, then move all the above into array
function playerLog(socket: any, nick: string, floor: number) {
  // Retrieve PlayerInstance
  socket.get("PlayerInstance", function (error: any, player: Player) {
    if (error) {
      console.error(error);
    } else {
      // Bind new client events
      socket.on("change_ready_state", function (readyState: boolean) {
        // If the server is currently waiting for players, update ready state
        if (_gameState === ServerState.WaitingForPlayers) {
          _playersManager.changeLobbyState(player, readyState);
          socket.broadcast.emit("player_ready_state", player.getPlayerObject());
        }
      });

      socket.on("player_jump", function () {
        player.jump();
      });

      // Set player's nickname and prepare him for the next game
      _playersManager.prepareNewPlayer(player, nick, floor);

      // Notify new client about other players AND notify other about the new one ;)
      socket.emit("player_list", _playersManager.getPlayerList());

      socket.broadcast.emit("new_player", player.getPlayerObject());
    }
  });
}

function updateGameState(newState: ServerStateEnum, notifyClients: boolean) {
  var log = "\t[SERVER] Game state changed ! Server is now ";

  _gameState = newState;

  switch (_gameState) {
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
  if (notifyClients) io.sockets.emit("update_game_state", _gameState);
}

function createNewGame() {
  let players;

  // Flush pipe list
  _pipeManager.flushPipeList();

  // Reset players state and send it
  players = _playersManager.resetPlayersForNewGame();

  for (let i = 0; i < players.length; i++) {
    io.sockets.emit("player_ready_state", players[i]);
  }

  // Notify players of the new game state
  updateGameState(ServerState.WaitingForPlayers, true);
}

function gameOver() {
  // Stop game loop
  clearInterval(_timer);

  _lastTime = null;

  // Change server state
  updateGameState(ServerState.Ranking, true);

  // Send players score
  _playersManager.sendPlayerScore();

  // After 5s, create a new game
  setTimeout(createNewGame, Const.TIME_BETWEEN_GAMES);
}

function startGameLoop() {
  // Change server state
  updateGameState(ServerState.OnGame, true);

  // Create the first pipe
  _pipeManager.newPipe();

  // Start timer
  _timer = setInterval(function () {
    let now = new Date().getTime();
    let ellapsedTime = 0;

    // get time difference between the last call and now
    if (_lastTime) {
      ellapsedTime = now - _lastTime;
    } else {
      _timeStartGame = now;
    }

    _lastTime = now;

    // If everyone has quit the game, exit it
    if (_playersManager.getNumberOfPlayers() === 0) {
      gameOver();
    }

    // Update players position
    _playersManager.updatePlayers(ellapsedTime);

    // Update pipes
    _pipeManager.updatePipes(ellapsedTime);

    // Check collisions
    if (
      checkCollision(
        _pipeManager.getPotentialPipeHit(),
        // @ts-ignore
        _playersManager.getPlayerList(PlayerState.Playing)
      )
    ) {
      if (!_playersManager.arePlayersStillAlive()) {
        gameOver();
      }
    }

    // Notify players
    io.sockets.emit("game_loop_update", {
      players: _playersManager.getOnGamePlayerList(),
      pipes: _pipeManager.getPipeList(),
    });
  }, 1000 / 60);
}

export function startServer() {
  io = require("socket.io").listen(Const.SOCKET_PORT);

  io.configure(function () {
    io.set("log level", 2);
  });

  _gameState = ServerState.WaitingForPlayers;

  // Create playersManager instance and register events
  _playersManager = new PlayersManager();

  _playersManager.on("players-ready", function () {
    startGameLoop();
  });

  // Create pipe manager and bind event
  _pipeManager = new PipeManager();

  _pipeManager.on("need_new_pipe", function () {
    // Create a pipe and send it to clients
    var pipe = _pipeManager.newPipe();
  });

  // On new client connection
  io.sockets.on("connection", function (socket: any) {
    // Add new player
    let player = _playersManager.addNewPlayer(socket, socket.id);

    // Register to socket events
    socket.on("disconnect", function () {
      socket.get("PlayerInstance", function (_: any, _player: Player) {
        _playersManager.removePlayer(_player);

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
        fn(_gameState, player.getID());

        playerLog(socket, nick, floor);
      }
    );

    // Remember PlayerInstance and push it to the player list
    socket.set("PlayerInstance", player);
  });

  console.log(
    "Game started and waiting for players on port " + Const.SOCKET_PORT
  );
}