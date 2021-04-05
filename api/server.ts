import Game from "./lib/birds/game";
import { constants } from "./constants";
import { Server } from "socket.io";

type GamesMap = {
  [key: string]: Game;
};

let games: GamesMap = {};

function getOrCreateGame(room: string) {
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
  const io = new Server(constants.SOCKET_PORT, {});

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

    getOrCreateGame(id).handle(socket);
  });

  console.log(
    "Game started and waiting for players on port " + constants.SOCKET_PORT
  );
}
