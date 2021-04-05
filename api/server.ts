import Game from "./lib/birds/game";
import { constants as Const } from "./constants";

/**
 * @todo convert to Socket.io instance
 */
let io: any;

let games: {
  [key: string]: Game;
} = {};

function getOrCreate(room: string) {
  if (!(room in games)) {
    let game = new Game();
    game.start();
    games[room] = game;
  }

  return games[room];
}

function deleteGame(room: string) {
  if (!(room in games)) {
    return;
  }

  games[room].stop();

  delete games[room];
}

export function start() {
  io = require("socket.io").listen(Const.SOCKET_PORT);

  io.configure(function () {
    io.set("log level", 2);
  });

  // On new client connection
  io.sockets.on("connection", function (socket: any) {
    let id = socket.handshake.query.roomID as string;

    if (id === "" || id === undefined) {
      socket.disconnect();

      return;
    }

    socket.on("close_game", () => {
      console.log("Delete the game");

      deleteGame(id);
    });

    getOrCreate(id).handle(socket);
  });

  console.log(
    "Game started and waiting for players on port " + Const.SOCKET_PORT
  );
}
